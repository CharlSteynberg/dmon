
// glob :: main
// --------------------------------------------------------------------------------------------------------
   "use strict";
   require('../lib/abec.njs');

   Main.Conf = Import('../cfg/dmon.v');
   Main.Mime = Import('../cfg/mime.v');
   Http.Code = Import('../cfg/code.v');
   View.Mico = Import('../cfg/mico.v');
   View.Html = Path.Browse('../gui/auto.htm');
   View.Mods = [];
// --------------------------------------------------------------------------------------------------------





// glob :: View.Init
// --------------------------------------------------------------------------------------------------------
   View.Init = function(resp,embd,code)
   {
      var text = View.Html.split('<!-- IMPORT -->');
      var host;

      text[0]+= '\n<script>'+Path.Browse('../gui/lib/abec.js')+'</script>\n';

      code = (code || 200);

      if (code < 400)
      {
         host = Dmon.vHosts[resp.Host];

         host.Mods.forEach(function(path)
         {
            text[0]+= '\n<script>'+Path.Browse(path)+'</script>\n';
         });
      }

      text[0]+= embd;
      text = text.join('');

      resp.writeHead(code, {'Content-Type':'text/html; charset=utf-8'});
      resp.end(text);
   }
// --------------------------------------------------------------------------------------------------------





// glob :: View.Fail
// --------------------------------------------------------------------------------------------------------
   View.Fail = function(resp,code)
   {
      code = (Http.Code[code] ? code : 500);

      var name = 'Server';
      var mesg = (code+' - '+Http.Code[code]);
      var tips = //
      [
         'make sure the requested path exists and that you have permission to access it',
         'if the problem persists, please contact support and it will be fixed promptly'
      ];

      var text = "Fail({Name:'"+name+"', Mesg:'"+mesg+"', Tips:['"+tips[0]+"', '"+tips[1]+"']});";
      View.Init(resp,'<script>'+text+'</script>',code);
   }
// --------------------------------------------------------------------------------------------------------





// glob :: Dmon : server
// --------------------------------------------------------------------------------------------------------
   Main.Dmon = // object
   {
      Update:function(list)
      {
         var each,hpth,auth,hcfg,plat,htxt,hdlm,hnlc,dpth,mods;

         list = (!list ? Conf.PathList : (((typeof list) == 'string') ? [list] : []));
         hpth = {win:'/Windows/System32/drivers/etc/hosts', lnx:'/etc/hosts', osx:undefined};
         plat = process.platform;
         plat = ((plat.indexOf('win') > -1) ? 'win' : ((plat.indexOf('nux') > -1) ? 'lnx' : null));
         hpth = ((!plat || !hpth[plat]) ? null : hpth[plat]);
         hnlc = ((plat=='win') ? '\r\n' : '\n');
         hdlm = (hnlc+hnlc+'# ---DMON--- #'+hnlc);

         if (hpth)
         {
            htxt = Path.Browse(hpth).split(hdlm);
            htxt[1] = (hnlc+Host.Addr+'      '+Conf.AutoHost);
         }

         list.forEach(function(path)
         {
            each = Path.Browse(path);
            if (!each || (each.length < 1)){ return; }

            each.forEach(function(host)
            {
               if (htxt){ htxt[1] += (hnlc+Host.Addr+'      '+host); }
               if (Dmon.vHosts[host]){ return; }

               path = (path+'/'+host).split('//').join('/');
               auth = Path.Access(path);

               if (!auth || (auth == 'f')){ return; }
               dpth = path+'/.dmon';
               hcfg = {};

               if (Path.Exists(dpth))
               {
                  if (Path.Exists(dpth+'/.conf'))
                  { hcfg = (Import(dpth+'/.conf') || {}); }
               }
               else
               { dpth = null; }

               hcfg.HttpPort = (hcfg.HttpPort || Conf.AutoPort);
               hcfg.DirViews = (hcfg.DirViews || Conf.DirViews);

               Dmon.vHosts[host] = // object
               {
                  Name:host,
                  Path:path,
                  Conf:hcfg,
                  Mods:[],
               };

               if (dpth && Path.Exists(dpth+'/.mods'))
               {
                  mods = Path.Browse(dpth+'/.mods');
                  mods.forEach(function(item)
                  {
                     var cpth = dpth+'/.mods/'+item+'/client.js';
                     var spth = dpth+'/.mods/'+item+'/server.js';
                  // console.log(spth);

                     if (Path.Exists(spth))
                     { require(spth); } // BAD IDEA !!! -- rather spawn separate child-process :: TODO

                     if (Path.Exists(cpth))
                     { Dmon.vHosts[host].Mods[Dmon.vHosts[host].Mods.length] = cpth; }
                  });
               }

               Dmon.Listen(hcfg.HttpPort);
            });
         });

         if (hpth)
         {
            try
            { Fsys.writeFileSync(hpth,htxt.join(hdlm)); }
            catch(e)
            {
               console.log('failed writing vhosts to `'+hpth+'`');
               process.exit(1);
            }
         }
      },



      Invoke:
      {
         GET:function(dom,req,rsp)
         {
            var host,root,conf,path,perm,stat,type,indx,file,extn,mime,size,base,text,list;

            dom = ((dom != Host.Addr) ? dom : Conf.AutoHost);

            host = Dmon.vHosts[dom];
            root = host.Path;
            conf = host.Conf;
            path = (root+'/'+req.path).split('//').join('/');

            rsp.Host = dom;

            if (!Path.Exists(path))
            {
               View.Fail(rsp,404);
               return;
            }

            perm = Path.Access(path);
            stat = Fsys.lstatSync(path);
            type = (stat.isDirectory() ? 'fold' : (stat.isFile() ? 'file' : null));
            indx = (function()
            {
               if (type != 'fold'){ return null; }

               for (file in Conf.DirIndex)
               {
                  file = Conf.DirIndex[file];

                  if (Path.Exists(path+'/'+file))
                  {
                     path = path+'/'+file;
                     perm = Path.Access(path);
                     return file;
                  }
               }
            }());

            if (!type || (perm == 'f') || ((type == 'fold') && !indx && !conf.DirViews))
            {
               View.Fail(rsp,403);
               return;
            }

            extn = path.split('.').pop();
            mime = (Mime[extn] || Mime['bin']);
            base = path.split('/').pop();

            if ((type == 'fold') && !indx)
            {
               list = Path.Browse(path);
               text = '';

               list.forEach(function(item,indx)
               {
                  stat = Fsys.lstatSync(path+'/'+item);
                  type = (stat.isDirectory() ? 'fold' : (stat.isFile() ? 'file' : null));
                  extn = ((type=='fold') ? type : ((item.split('.').pop()) || 'file'));
                  size = ((type=='fold') ? (Path.Browse(path+'/'+item)).length : stat.size);

                  item = // obj
                  {
                     Icon:(View.Mico[extn] || View.Mico['file']),
                     Path:(path.split(dom)[1]+'/'+item).split('//').join('/'),
                     Name:item,
                     Size:((type=='fold') ? (size+' Itm') : (+(((size /1024) /100).toFixed(3))+' Mb')),
                  };

                  text+= '<table class="mrgn-01 link" style="width:50%" onclick="Goto(\''+item.Path+'\')"><tr>';
                  text+= '<td class="size-02" style="width:2rem"><i class="icon-'+item.Icon+'"></i></td>';
                  text+= '<td class="size-01" style="width:auto">'+item.Path+'</td>';
                  text+= '<td class="text-rigt" style="width:10rem; font-size:1rem; opacity:0.6"><pre>'+item.Size+'</pre></td>';
                  text+= '</tr></table>';
               });

               View.Init(rsp,text);
               return;
            }

            if ((type == 'fold') && (indx != 'index.html'))
            {
               if (indx == 'auto.njs')
               {
                  (function(req,rsp){ Import(path); }(req,rsp));
                  return;
               }

               if (indx == 'auto.htm')
               {
                  View.Init(rsp,Path.Browse(path));
                  return;
               }

               if (indx == 'auto.js')
               {
                  View.Init(rsp,'<script>'+Path.Browse(path)+'</script>');
                  return;
               }
            }


            rsp.writeHead(200, {'Content-Type':mime});
            Fsys.createReadStream(path).pipe(rsp);
         },


         SET:function(dom,req,rsp)
         {

         },
      },



      Listen:function(port)
      {
         if (this.live[(port+'')]){ return; }

         this.live[(port+'')] = Http.createServer(function(req,rsp)
         {
            var vdom,meth,prts,path,extn,vars;

            vdom = req.headers.host;
            meth = req.method;
            prts = req.url.split('?');
            path = prts[0];
            vars = (function(resl)
            {
               resl = {};
               if (!prts[1]){ return resl; }
               prts = prts[1].split('+').join(' ');
               prts = prts.split('&');

               prts.forEach(function(item)
               {
                  item = item.split('=');
                  resl[item[0]] = (item[1] ? decodeURIComponent(item[1]) : '');
               });

               return resl;
            }());

            req.path = path;

            if (Dmon.Invoke.hasOwnProperty(meth))
            {
               Dmon.Invoke[meth](vdom,req,rsp);
               return;
            }

            rsp.statusCode = 405;
            rsp.end();
         }).listen(port,Host.Addr);
      }
      .bind
      ({
         live:{},
      }),



      vHosts:
      {
         [Conf.AutoHost]:
         {
            Path:((__filename).split('C:').join('').split('\\').join('/').split('/run/dmon.js')[0]+'/gui'),
            Conf:
            {
               HttpPort:Conf.AutoPort,
               DirViews:Conf.DirViews,
            },
         }
      },
   };
// --------------------------------------------------------------------------------------------------------





// glob :: init : initialize server & watch domain paths for events
// --------------------------------------------------------------------------------------------------------
   Dmon.Listen(Conf.AutoPort);
   Dmon.Update();

   Conf.PathList.forEach(function(path)
   {
      Fsys.watch(path,(type,refr)=>
      {
         if (refr)
         {
            if (refr.indexOf(' ') < 0)
            { Dmon.Update(); }
         }
      });
   });
// --------------------------------------------------------------------------------------------------------
