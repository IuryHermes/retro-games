(function(){
  const definitions={
    'FUNDADOR':{slug:'founder',label:'Fundador'},
    'APOIADOR':{slug:'supporter',label:'Apoiador'},
    'GUARDIÃO':{slug:'guardian',label:'Guardião'},
    'PATRONO':{slug:'patron',label:'Patrono'},
    '3 MESES':{slug:'months-3',label:'3 Meses'},
    '6 MESES':{slug:'months-6',label:'6 Meses'},
    '12 MESES':{slug:'months-12',label:'12 Meses'}
  };
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const lookup=new Map(Object.entries(definitions).map(([key,value])=>[normalize(key),value]));
  function create(labels,options={}){
    const list=document.createElement('div');
    list.className=`club-badge-list${options.variant?` club-badge-list--${options.variant}`:''}${options.className?` ${options.className}`:''}`;
    list.setAttribute('aria-label','Selos do Clube Neo');
    for(const raw of Array.isArray(labels)?labels:[]){
      const definition=lookup.get(normalize(raw));
      if(!definition)continue;
      const badge=document.createElement('span');badge.className=`club-badge club-badge--${definition.slug}`;badge.title=definition.label;
      const art=document.createElement('span');art.className='club-badge-art';art.setAttribute('aria-hidden','true');
      const label=document.createElement('span');label.className='club-badge-label';label.textContent=definition.label;
      badge.append(art,label);list.append(badge);
    }
    list.hidden=!list.children.length;
    return list;
  }
  function avatar(image,labels,options={}){
    const frame=document.createElement('span');frame.className=`club-avatar-frame${options.className?` ${options.className}`:''}`;
    frame.append(image,create(labels,{variant:options.variant||'icons'}));
    return frame;
  }
  window.NeoClubBadges={create,avatar};
})();
