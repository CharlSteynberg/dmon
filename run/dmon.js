
// glob :: main
// --------------------------------------------------------------------------------------------------------
   "use strict";
   require('../lib/abec.js');

   Main.Conf = Import('/cfg/dmon.v');
   Main.Mime = Import('/cfg/mime.v');
   View.Mico = Import('/cfg/mico.v');
   View.Html = Path.Browse('../gui/auto.htm');
   View.LsFl = Path.Browse('../gui/lib/lsfl.js');

   View.Html+= '<script>'+Path.Browse('../gui/lib/abec.js')+'</script>\n';
// --------------------------------------------------------------------------------------------------------





// glob :: Dmon : server
// --------------------------------------------------------------------------------------------------------
   Main.Dmon = // object
   {
      Update:function(list)
      {
         var each,hpth,auth,hcfg,plat,htxt,hdlm,hnlc;

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
               hcfg = (Path.Exists(path+'/.conf') ? Import(path+'/.conf') : {});
               hcfg.HttpPort = (hcfg.HttpPort || Conf.AutoPort);
               hcfg.DirViews = (hcfg.DirViews || Conf.DirViews);

               Dmon.vHosts[host] = // object
               {
                  Path:path,
                  Conf:hcfg,
               };

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

            if (!Path.Exists(path))
            {
               rsp.statusCode = 404;
               rsp.end();
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
                     type = 'file';
                     return file;
                  }
               }
            }());

            if (!type || (perm == 'f') || ((type == 'fold') && !indx && !conf.DirViews))
            {
               rsp.statusCode = 403;
               rsp.end();
               return;
            }

            extn = path.split('.').pop();
            mime = (Mime[extn] || Mime['bin']);
            base = path.split('/').pop();

            if ((type == 'fold') && !indx)
            {
               list = Path.Browse(path);

               list.forEach(function(item,indx)
               {
                  stat = Fsys.lstatSync(path+'/'+item);
                  type = (stat.isDirectory() ? 'fold' : (stat.isFile() ? 'file' : null));
                  extn = ((type=='fold') ? type : ((item.split('.').pop()) || 'file'));
                  size = ((type=='fold') ? (Path.Browse(path+'/'+item)).length : stat.size);

                  list[indx] = // obj
                  {
                     Icon:(View.Mico[extn] || View.Mico['file']),
                     Path:(path.split(dom)[1]+'/'+item).split('//').join('/'),
                     Name:item,
                     Size:((type=='fold') ? (size+' Itm') : (+(((size /1024) /100).toFixed(3))+' Mb')),
                  };
               });

               list = JSON.stringify(list);
               text = (View.Html+'<script>\nwindow.ViewData={FoldList:'+list+'};\n'+View.LsFl+'</script>');
               size = text.length;

               rsp.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
               rsp.end(text);
               return;
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
Dmon.Listen(Conf.AutoPort);
Dmon.Update();

Conf.PathList.forEach(function(path)
{
   Fsys.watch(path,(type,refr)=>
   {
      if (refr)
      {
         if (refr.indexOf(' ') > -1){ return; }
         Dmon.Update();
      }
   });
});
