import { Application, send, join } from './deps.ts'
import { html, ReactComponents, protectedPage } from './ssrConstants.tsx';
import router from "./routes.ts";
import Dashport from '../lib/dashport.ts'
import GoogleStrat from '../lib/strategies/ScratchGoogle.ts'
import GitHubStrategy from '../lib/strategies/Github.ts'

const port = 3000;
const app: Application = new Application();
const dashport = new Dashport('oak');

// Error handling
app.use(async (ctx: any, next: any) => {
  debugger;
  try{
    await next();
  } catch (error) {
    console.log('server 51', error);
    throw error;
  }
});

app.use(dashport.initialize);

app.use(router.routes());
app.use(router.allowedMethods());

// dashport.addStrategy('google', new GoogleStrat({
//   client_id:'1001553106526-ri9j20c9uipsp6q5ubqojbuc5e19dkgp.apps.googleusercontent.com',
//   redirect_uri: 'http://localhost:3000/test', 
//   response_type: 'code', 
//   scope: 'profile email openid',
//   client_secret: 'e44hA4VIInrJDu_isCDl3YCr',
//   grant_type: 'authorization_code',
// }));

dashport.addStrategy('github', new GitHubStrategy({
  client_id:'b3e8f06ac81ab03c46ca', 
  client_secret: 'b9cc08bb3318a27a8306e4fa74fc22758d29b3fc', 
  redirect_uri: 'http://localhost:3000/test', 
  scope: 'read:user',  
}));

dashport.addSerializer('mathRand', (userData: any) => Math.random() * 10000);

// router.get('/test', 
//   dashport.authenticate('google'),
//   (ctx: any, next: any) => {
//     if(ctx.state._dashport.session){
//       ctx.response.redirect('/protected');
//     }
//   }
// )
router.get('/test', 
  dashport.authenticate('github'),
  (ctx: any, next: any) => {
    if(ctx.state._dashport.session){
      ctx.response.redirect('/protected');
    }
  }
)

router.get('/protected',
  (ctx: any, next: any) => {
    if(!ctx.state._dashport.session){
      ctx.response.body = 'You need to log in first. Please try again'
    } else {
      ctx.response.type = `text/html`
      ctx.response.body = protectedPage
      
    }
  }
)

//response tracking
app.use(async (ctx: any, next: any) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log( 
    `${ctx.request.method} ${ctx.request.url} - Response Time = ${rt}`
  );
});

app.use(async (ctx: any, next: any) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

// page routing
app.use(async (ctx: any) => {
   if (ctx.request.url.pathname === '/') { 
     ctx.response.type = `text/html`
     ctx.response.body = html
   }  else if (ctx.request.url.pathname === '/test.js') {
      ctx.response.type = "application/javascript"
      ctx.response.body = ReactComponents
   }  else if (ctx.request.url.pathname === '/style.css') {
      ctx.response.type = "text/css"
      await send(ctx, ctx.request.url.pathname, {
        root: join(Deno.cwd(), "demo/views/assets"),
      });
   }
});

// listening on port
app.addEventListener('listen', () => { console.log(`Server live on port ${port}`) });
await app.listen({ port });

// denon run --allow-all --unstable demo/server.tsx
// deno install -qAf --unstable https://deno.land/x/denon/denon.ts
