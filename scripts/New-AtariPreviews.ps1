param(
    [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\.atari-staging\previews'),
    [int]$Width = 320,
    [int]$Height = 240
)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$pngFiles = Get-ChildItem -LiteralPath $SourceDirectory -File -Filter '*.png'
foreach ($file in $pngFiles) {
    $stream = [System.IO.File]::OpenRead($file.FullName)
    try {
        $decoder = [System.Windows.Media.Imaging.PngBitmapDecoder]::new(
            $stream,
            [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
            [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
        )
        $source = $decoder.Frames[0]
    } finally { $stream.Dispose() }

    $encoder = [System.Windows.Media.Imaging.GifBitmapEncoder]::new()
    $moves = @(
        @{ Scale = 1.00; X = 0;  Y = 0  },
        @{ Scale = 1.04; X = -6; Y = -4 },
        @{ Scale = 1.07; X = -10; Y = -7 },
        @{ Scale = 1.04; X = -5; Y = -3 },
        @{ Scale = 1.00; X = 0;  Y = 0  }
    )
    $frameIndex = 0
    foreach ($move in $moves) {
        $visual = [System.Windows.Media.DrawingVisual]::new()
        $context = $visual.RenderOpen()
        $context.DrawRectangle([System.Windows.Media.Brushes]::Black, $null, [System.Windows.Rect]::new(0, 0, $Width, $Height))
        $fit = [Math]::Min($Width / $source.PixelWidth, $Height / $source.PixelHeight) * $move.Scale
        $drawWidth = $source.PixelWidth * $fit
        $drawHeight = $source.PixelHeight * $fit
        $x = (($Width - $drawWidth) / 2) + $move.X
        $y = (($Height - $drawHeight) / 2) + $move.Y
        $context.DrawImage($source, [System.Windows.Rect]::new($x, $y, $drawWidth, $drawHeight))
        $context.Close()

        $bitmap = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($Width, $Height, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
        $bitmap.Render($visual)
        $metadata = [System.Windows.Media.Imaging.BitmapMetadata]::new('gif')
        $metadata.SetQuery('/grctlext/Delay', [uint16]18)
        $metadata.SetQuery('/grctlext/Disposal', [byte]2)
        if ($frameIndex -eq 0) {
            $metadata.SetQuery('/appext/application', [Text.Encoding]::ASCII.GetBytes('NETSCAPE2.0'))
            $metadata.SetQuery('/appext/data', [byte[]](3, 1, 0, 0))
        }
        $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap, $bitmap.Thumbnail, $metadata, $bitmap.ColorContexts))
        $frameIndex++
    }

    $gifPath = [System.IO.Path]::ChangeExtension($file.FullName, '.gif')
    $output = [System.IO.File]::Create($gifPath)
    try { $encoder.Save($output) } finally { $output.Dispose() }
    # WPF grava os quadros, mas ignora a extensão de repetição. Insere o
    # bloco NETSCAPE2.0 diretamente após a tabela global de cores (loop 0).
    $bytes = [System.IO.File]::ReadAllBytes($gifPath)
    $hasGlobalTable = ($bytes[10] -band 0x80) -ne 0
    $tableSize = if ($hasGlobalTable) { 3 * [Math]::Pow(2, (($bytes[10] -band 0x07) + 1)) } else { 0 }
    $insertAt = 13 + [int]$tableSize
    $loopBlock = [byte[]](0x21,0xFF,0x0B,0x4E,0x45,0x54,0x53,0x43,0x41,0x50,0x45,0x32,0x2E,0x30,0x03,0x01,0x00,0x00,0x00)
    $stream = [System.IO.MemoryStream]::new()
    try {
        $stream.Write($bytes, 0, $insertAt)
        $stream.Write($loopBlock, 0, $loopBlock.Length)
        $stream.Write($bytes, $insertAt, $bytes.Length - $insertAt)
        [System.IO.File]::WriteAllBytes($gifPath, $stream.ToArray())
    } finally { $stream.Dispose() }
}

Write-Output "Generated $($pngFiles.Count) animated Atari previews."
