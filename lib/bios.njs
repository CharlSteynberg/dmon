
// glob :: main
// --------------------------------------------------------------------------------------------------------
   "use strict";
   require('../lib/abec.njs');
// --------------------------------------------------------------------------------------------------------





// glob :: Bios : basic input output system
// --------------------------------------------------------------------------------------------------------
   Define
   ({
      Bios:function(defn)
      {
         defn = (defn || {void:VOID});

         var name = (defn.Keys(0) || 'void');
         var driv = Bios[name];

         if (!isNode(driv) || !driv.hasKey('Create'))
         { throw 'Bios[`'+name+'`] is not properly defined'; }

         return driv.Create(defn[name]);
      }
   });
// --------------------------------------------------------------------------------------------------------





// extn :: Bios.ws : web-socket
// --------------------------------------------------------------------------------------------------------
   Extend(Bios)
   ({
      ws:
      {
         Create:function(port)
         {
            var inst;

            port = (port *1);
            inst = copyOf(Bios.ws);

            inst.Ticker = new Sock.Server({port:port});

            return inst;
         },


         Listen:function(evnt)
         {
            this.Send = function(data,indx)
            {
               indx = (indx || 0);
               this.Ticker.Client[indx].send(data);
            };

            this.Ticker.Client = [];
            this.Ticker.Events = evnt;
            this.Ticker.on('connection',function(sock)
            {
               this.Events.Each = function(func,name)
               {
                  name = ((name=='mesg') ? 'message' : name);
                  sock.on(name,func);
               };

               this.Client[this.Client.length] = sock;
            });

            return this;
         },
      },
   });
// --------------------------------------------------------------------------------------------------------





// extn :: Bios.dev : device
// --------------------------------------------------------------------------------------------------------
   Extend(Bios)
   ({
      dev:
      {
         Create:function(driv)
         {
            if (!this.Driver.hasKey(driv) || !isFunc(this.Driver[driv].Create))
            {
               throw 'Bios.dev.Diver[`'+driv+'`] is not properly defined';
            }

            return this.Driver[driv].Create();
         },


         // Listen:function()
         // {
         // },


         Driver:
         {
            usb:
            {
               Status:null,
               Mounts:[],
               Events:[],
               GetAll:function(func)
               {
                  var cmnd = 'wmic logicaldisk where drivetype=2 get deviceid, volumename, description';

                  Exec(cmnd,function(fail,stdo,stde)
                  {
                     var list = [];
                     var prts,mont,name,desc;

                     stdo = stdo.toString().trim().split('\r\n').join('\n').split('\r').join('').split('\n');
                     stdo.shift();

                     stdo.forEach(function(line)
                     {
                        prts = line.split(':');
                        name = (prts[1].trim() || 'USBDEV');
                        prts = prts[0].split(' ');
                        mont = (prts.pop() +':');
                        desc = prts.join(' ').trim();

                        list[list.length] = {Root:mont, Name:name, Desc:desc};
                     });

                     func(list);
                  });
               },


               Create:function()
               {
                  Bios.dev.Driver.usb.GetAll((list)=>
                  {
                     Bios.dev.Driver.usb.Mounts = list;

                     setInterval(()=>
                     {
                        Bios.dev.Driver.usb.GetAll((nlst)=>
                        {
                           var olen = Bios.dev.Driver.usb.Mounts.length;
                           var nlen = nlst.length;
                           var evnt = ((nlen > olen) ? 'attach' : 'detach');

                           if (olen != nlen)
                           {
                              Bios.dev.Driver.usb.Mounts = nlst;
                              Bios.dev.Driver.usb.Events.forEach((trig)=>
                              {
                                 if (isFunc(trig[evnt]))
                                 { trig[evnt](nlst); }
                              });
                           }
                        });
                     },500);
                  });

                  return this;
               },


               Listen:function(evnt)
               {
                  Bios.dev.Driver.usb.Events.Insert(evnt);
                  return this;
               },
            }
         }
      }
   });
// --------------------------------------------------------------------------------------------------------
/*
   Udev.Status = null;
   Udev.Mounts = [];
   Udev.Events = [];
   Udev.GetAll = function(func)
   {
      Exec('wmic logicaldisk where drivetype=2 get deviceid, volumename, description',(fail,stdo,stde)=>
      {
         var list = [];
         var prts,mont,name,desc;

         stdo = stdo.toString().trim().split('\r\n').join('\n').split('\r').join('').split('\n');
         stdo.shift();

         stdo.forEach(function(line)
         {
            prts = line.split(':');
            name = (prts[1].trim() || 'USBDEV');
            prts = prts[0].split(' ');
            mont = (prts.pop() +':');
            desc = prts.join(' ').trim();

            list[list.length] = {Root:mont, Name:name, Desc:desc};
         });

         func(list);
      });
   };

   Udev.Listen = function(func)
   {
      Udev.Events[Udev.Events.length] = func;
      if (Udev.Status=='ready'){return;}

      Udev.GetAll((list)=>
      {
         Udev.Mounts = list;

         setInterval(()=>
         {
            Udev.GetAll((nlst)=>
            {
               var olen = Udev.Mounts.length;
               var nlen = nlst.length;
               var evnt = ((nlen > olen) ? 'attach' : 'detach');

               if (olen != nlen)
               {
                  Udev.Mounts = nlst;

                  Udev.Events.forEach((trig)=>
                  { trig(evnt,nlst); });
               }
            });
         },500);
      });
   };
// --------------------------------------------------------------------------------------------------------
*/




// extn :: Bios.http : web-server
// --------------------------------------------------------------------------------------------------------
   Extend(Bios)
   ({
      http:
      {
         Create:function(sock)
         {
            var name,port,hpth,htxt,plat,hnlc,hdlm;

            port = (((Main.Conf && Main.Conf.host) ? Main.Conf.host.HttpPort : 80) *1);
            sock = (!sock.hasAny(':') ? (sock+':'+port) : sock).split(':');
            port = (!isNaN(sock[1]) ? (sock[1] *1) : port);
            name = sock[0];

            if ((port < 80) || (port > 65535)){ throw 'invalid port number'; }

            Host.HttpName = name;
            Host.HttpPort = port;

            hpth = {win:'/Windows/System32/drivers/etc/hosts', lnx:'/etc/hosts', osx:undefined};
            plat = process.platform;
            plat = ((plat.indexOf('win') > -1) ? 'win' : ((plat.indexOf('nux') > -1) ? 'lnx' : null));
            hpth = ((!plat || !hpth[plat]) ? null : hpth[plat]);
            hnlc = ((plat=='win') ? '\r\n' : '\n');
            hdlm = (hnlc+hnlc+'# ---DMON--- #'+hnlc);


            if (hpth)
            {
               htxt = Path.Read(hpth).split(hdlm);
               htxt[1] = (hnlc+Host.IPv4Addr+'      '+name);

               try
               { Fsys.writeFileSync(hpth,htxt.join(hdlm)); }
               catch(e)
               {
                  dump('failed writing HttpHost-name to `'+hpth+'`');
                  process.exit(1);
               }
            }

            return Bios.http;
         },



         Listen:function(evnt)
         {
            if (!isNode(evnt)){ throw 'expecting typeOf: `NODE`'; }
            Host.HttpEvnt.Modify(evnt);

            Host.HttpDmon = Http.createServer(function(req,rsp)
            {
               var prts = req.url.split('?');
               var path = (Host.RootPath+'/'+prts[0]).Swap('//','/');
               var type = Path.Type(path);
               var meth = (Host.HttpMeth[req.method] || req.method);
               var vars = nodeOf(prts[1]);

               req.Vars = vars;
               req.Path = path;

               meth = (((meth == 'PULL') && (type == 'fold')) ? 'LIST' : meth);

               if (Host.HttpEvnt.hasKey(meth))
               { Host.HttpEvnt[meth](req,rsp); return; }

               rsp.Code = 405;
               Host.HttpEvnt['FAIL'](req,rsp);
            }).listen(Host.HttpPort,Host.IPv4Addr);


            if (Host.DmonMods)
            {
               var mpth = (Host.RootPath+'/.dmon/.mods');
               var mdpn;

               Host.DmonMods.Each = function(dmod)
               {
                  mdpn = (mpth+'/'+dmod+'/server.js');

                  if (Path.Type(mdpn) == 'file')
                  { Import(mdpn); }
               };
            }

            return Bios.http;
         },
      }
   });
// --------------------------------------------------------------------------------------------------------
