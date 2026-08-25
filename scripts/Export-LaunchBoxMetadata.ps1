param(
    [Parameter(Mandatory=$true)][string]$MetadataPath,
    [string]$OutputPath = ''
)

if (!$OutputPath) { $OutputPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..\.catalog-metadata\launchbox.json' }

$platforms = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
@('Atari 2600','Nintendo Entertainment System','Super Nintendo Entertainment System','Nintendo 64','Nintendo Game Boy Advance','Game Boy Advance','Sega Genesis','Sony Playstation') | ForEach-Object { [void]$platforms.Add($_) }
$results = [Collections.Generic.List[object]]::new()
$settings = [Xml.XmlReaderSettings]::new()
$settings.IgnoreComments = $true
$settings.IgnoreWhitespace = $true
$reader = [Xml.XmlReader]::Create($MetadataPath, $settings)
try {
    [void]$reader.MoveToContent()
    while (!$reader.EOF) {
        if ($reader.NodeType -ne [Xml.XmlNodeType]::Element -or $reader.Name -ne 'Game') { [void]$reader.Read(); continue }
        $outer = $reader.ReadOuterXml()
        $game = ([xml]$outer).Game
        if (!$platforms.Contains([string]$game.Platform)) { continue }
        $results.Add([pscustomobject]@{
            name = [string]$game.Name; platform = [string]$game.Platform
            overview = [string]$game.Overview; year = [string]$(if ($game.ReleaseYear) { $game.ReleaseYear } else { $game.ReleaseDate })
            developer = [string]$game.Developer; publisher = [string]$game.Publisher
            genres = [string]$game.Genres; maxPlayers = [string]$game.MaxPlayers
            cooperative = [string]$game.Cooperative; esrb = [string]$game.ESRB
            rating = [double]([string]$game.CommunityRating -replace '^$','0')
            ratingCount = [int]([string]$game.CommunityRatingCount -replace '^$','0')
            databaseId = [string]$game.DatabaseID; wikipedia = [string]$game.WikipediaURL
        })
    }
} finally { $reader.Dispose() }
$directory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $directory | Out-Null
[IO.File]::WriteAllText($OutputPath, ($results | ConvertTo-Json -Depth 4), [Text.UTF8Encoding]::new($false))
Write-Output "Exported $($results.Count) LaunchBox games to $OutputPath"
