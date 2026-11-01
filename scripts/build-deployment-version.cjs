'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function stamp(html,version,versionOrigin=''){
    html=html.replace(/<!-- the-view-deployment:start -->[\s\S]*?<!-- the-view-deployment:end -->\s*/g,'');
    html=html.replace(/(<(?:script|link)\b[^>]*(?:src|href)=")([^"\s]+)(")/g,(whole,start,asset,end)=>{
      if(/^(?:https?:|\/\/|data:)/i.test(asset)||!/^([^?]+\.(?:js|css))(?:\?|$)/.test(asset))return whole;
      const url=new URL(asset,'https://build.invalid');url.searchParams.set('tv_build',version);return start+(asset.startsWith('/')?url.pathname:url.pathname.slice(1))+url.search+end;
    });
    const bootstrap=`<!-- the-view-deployment:start --><meta name="the-view-deployment" content="${version}"><meta name="the-view-version-origin" content="${versionOrigin}"><link rel="stylesheet" href="/deployment-guard.css?v=${version}"><script src="/deployment-guard.js?v=${version}" defer></script><!-- the-view-deployment:end -->\n`;
    if(!html.includes('</head>'))throw Error('Missing HTML head');
    return html.replace('</head>',bootstrap+'</head>');
}
function build(root,env=process.env){
  const identity=env.VERCEL_DEPLOYMENT_ID||env.VERCEL_URL;
  if(!identity||!['production','preview','development'].includes(env.VERCEL_ENV))throw Error('Deployment identity unavailable; refusing an unversioned build');
  const version=crypto.createHash('sha256').update(identity).digest('hex');
  const domain=env.VERCEL_PROJECT_PRODUCTION_URL;
  if(env.VERCEL_ENV==='production'&&!/^[a-z0-9.-]+$/i.test(domain||''))throw Error('Production version domain unavailable');
  const origin=env.VERCEL_ENV==='production'?'https://'+domain:'';
  for(const file of ['index.html','commercial.html','comparador.html','access.html']){
    const target=path.join(root,file);fs.writeFileSync(target,stamp(fs.readFileSync(target,'utf8'),version,origin));
  }
  fs.writeFileSync(path.join(root,'deployment-version.json'),JSON.stringify({version,format:1}));
  return version;
}
if(require.main===module){if(process.env.VERCEL!=='1')throw Error('Run only in the deployment build; tests must use an isolated directory');build(path.resolve(__dirname,'..'));console.log('Versioned operational HTML and public deployment identifier generated');}
module.exports={build,stamp};
