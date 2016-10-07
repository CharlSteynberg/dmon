
// glob :: main
// --------------------------------------------------------------------------------------------------------
   "use strict";
   require('../lib/bios.njs');
   Main.Conf = Import('../cfg');
// --------------------------------------------------------------------------------------------------------





// extn :: Host config
// --------------------------------------------------------------------------------------------------------
   Host.Modify(Conf.host);
   Host.HttpName = Path.Read(Host.RootPath)[0];
   Host.RootPath = (Host.RootPath+'/'+Host.HttpName);
   Host.InitHTML = Path.Read('../gui/auto.htm');
   Host.DirsHTML = Path.Read('../gui/dirs.htm');


   if (Path.Type(Host.RootPath+'/.dmon') == 'fold')
   {
      if (Path.IsAt(Host.RootPath+'/.dmon/.conf'))
      { Host.Modify(Import(Host.RootPath+'/.dmon/.conf')); }

      if (Path.Type(Host.RootPath+'/.dmon/.mods') == 'fold')
      { Host.DmonMods = Path.Read(Host.RootPath+'/.dmon/.mods'); }
   }

   Host.HttpMeth = // node :: alternative http-method names
   {
      GET:'PULL',    // pull file/records data
      PUT:'PUSH',    // push upload/binary data
      POST:'SAVE',   // save form data
      DELETE:'DROP', // drop file/records data
   };
// --------------------------------------------------------------------------------------------------------





// extn :: Host HTTP events
// --------------------------------------------------------------------------------------------------------
   Host.HttpEvnt = // node
   {
   // evnt :: INIT : initialize GUI
   // -----------------------------------------------------------------------------------------------------
      INIT:function(requ,resp,embd)
      {
         var prts = Host.InitHTML.split('<!-- IMPORT -->');
         var code = (resp.Code || 200);
         var mpth = (Host.RootPath+'/.dmon/.mods');
         var mdpn = null;

         prts[0]+= '\n<script>'+Path.Read('../gui/lib/abec.js')+'</script>\n\n'+embd;

         if (Host.DmonMods && (code == 200))
         {
            Host.DmonMods.Each = function(dmod)
            {
               mdpn = (mpth+'/'+dmod+'/client.js');

               if (Path.Type(mdpn) == 'file')
               { prts[0]+= '\n<script name="'+dmod+'_mod">\n'+Path.Read(mdpn)+'\n</script>\n'; }
            };
         }

         resp.writeHead(code, {'Content-Type':'text/html; charset=utf-8'});
         resp.end((prts.join('')));
      },
   // -----------------------------------------------------------------------------------------------------



   // evnt :: FAIL : show server fail message
   // -----------------------------------------------------------------------------------------------------
      FAIL:function(requ,resp)
      {
         var code = (Conf.code[resp.Code] ? resp.Code : 500);
         var name = 'Server';
         var mesg = (code+' - '+Conf.code[code]);
         var tips = //
         [
            'make sure the requested path exists and that you have permission to access it',
            'if the problem persists, please contact support and it will be fixed promptly'
         ];

         var text = "Fail({Name:'"+name+"', Mesg:'"+mesg+"', Tips:['"+tips[0]+"', '"+tips[1]+"']});";
         this.INIT(requ,resp,'<script>'+text+'</script>');
      },
   // -----------------------------------------------------------------------------------------------------



   // evnt :: LIST : (GET) show folder items if dir-indexing is true
   // -----------------------------------------------------------------------------------------------------
      LIST:function(requ,resp)
      {
         var path,auth,code,list,indx,html,dhtm,type,extn,size;

         path = requ.Path;
         auth = Path.Auth(path);
         code = (!auth ? 404 : ((!Host.ViewDirs || (auth == 'f')) ? 403 : 200));
         list = ((code == 200) ? Path.Read(path) : null);
         html = '';
         dhtm = Host.DirsHTML;

         resp.Code = code;
         if (code != 200){ this.FAIL(requ,resp); return; }


         if (list.hasAny(Host.DirIndex))
         {
            indx = list.Find(Host.DirIndex);
            indx = (!indx ? null : indx[1]);

            if (indx)
            {
               path = (path+'/'+indx).Swap('//','/');
               extn = indx.split('.').pop();
               auth = Path.Auth(path);

               if (!auth || (auth == 'f'))
               {
                  requ.Code = (!auth ? 404 : 403);
                  this.FAIL(requ,resp);
                  return;
               }

               if (extn == 'html')
               {
                  resp.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
                  resp.end(Path.Read(path));
                  return;
               }

               html = Path.Read(path);
               html = ((extn == 'js') ? ('\n<script>\n'+html+'\n</script>\n') : html);
               this.INIT(requ,resp,html);
               return;
            }
         }

         list.forEach(function(item,indx)
         {
            type = Path.Type(path+'/'+item);
            extn = ((type=='fold') ? type : ((item.split('.').pop()) || 'file'));
            size = Path.Size(path+'/'+item);

            html+= dhtm.Swap
            ({
               '<{PATH}>':(path.split(Host.HttpName)[1]+'/'+item).Swap('//','/'),
               '<{ICON}>':(Conf.mico[extn] || Conf.mico['file']),
               '<{NAME}>':item,
               '<{SIZE}>':((type=='fold') ? (size+' Itm') : (+(((size /1024) /100).toFixed(3))+' Mb')),
            });
         });

         this.INIT(requ,resp,html);
         return;
      },
   // -----------------------------------------------------------------------------------------------------



   // evnt :: PULL : (GET) serve (stream) data/contents - client pulls data
   // -----------------------------------------------------------------------------------------------------
      PULL:function(requ,resp)
      {
         var path,extn,mime,auth;

         path = requ.Path;
         extn = path.split('.').pop();
         mime = (Conf.mime[extn] || Conf.mime['bin']);
         auth = Path.Auth(path);

         if (!auth || (auth == 'f'))
         {
            requ.Code = (!auth ? 404 : 403);
            this.FAIL(requ,resp);
            return;
         }

         resp.writeHead(200, {'Content-Type':mime});
         Fsys.createReadStream(path).pipe(resp);
      },
   // -----------------------------------------------------------------------------------------------------



   // evnt :: PUSH : (PUT/POST) upload (receive) data/contents - client pushes data
   // -----------------------------------------------------------------------------------------------------
      PUSH:function(requ,resp)
      {

      },
   // -----------------------------------------------------------------------------------------------------
   }
// --------------------------------------------------------------------------------------------------------




// tick :: http events
// --------------------------------------------------------------------------------------------------------
   Bios({http:(Host.HttpName+':'+Host.HttpPort)}).Listen({}); // defaults
// --------------------------------------------------------------------------------------------------------



/*

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

                  html+= '<table class="mrgn-01 link" style="width:50%" onclick="Goto(\''+item.Path+'\')"><tr>';
                  html+= '<td class="size-02" style="width:2rem"><i class="icon-'+item.Icon+'"></i></td>';
                  html+= '<td class="size-01" style="width:auto">'+item.Path+'</td>';
                  html+= '<td class="text-rigt" style="width:10rem; font-size:1rem; opacity:0.6"><pre>'+item.Size+'</pre></td>';
                  html+= '</tr></table>';
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

*/
