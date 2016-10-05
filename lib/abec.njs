
// glob :: main
// --------------------------------------------------------------------------------------------------------
   "use strict";
   global.Main = global;

   Main.Fsys = require('fs');
   Main.Http = require('http');
   Main.Host = require('os');
   Main.View = {};
   Main.Exec = require('child_process').exec;
   Main.Udev = {};

   Host.Addr = (function(list)
   {
      list = Host.networkInterfaces();

      for (var name in list)
      {
         if (name.indexOf('Loopback') > -1)
         { continue; }

         for (var item in list[name])
         {
            if (list[name][item].family == 'IPv4')
            { return list[name][item].address; }
         }
      }
   }());


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





// glob :: Import
// --------------------------------------------------------------------------------------------------------
   Main.Import = function(path)
   {
      var extn,self,modu;

      if (path.indexOf('/') < 0)
      {
         modu = path;
         path = ('./node_modules/'+modu);

         try{ modu=require(modu); return modu; }catch(e){}
         try{ modu=require(path); return modu; }catch(e){}

         return;
      }

      path = path.split('//').join('/');

      var extn = path.split('.').pop();
      var self = this;

      if (self[extn])
      { return self[extn](path); }
   }
   .bind
   ({
      v:function(defn)
      {
         var resl,prts,name,data,cnst;

         defn = Fsys.readFileSync(defn,'utf8');
         defn = defn.split('\r\n').join('\n').split('\n');
         resl = {};
         cnst = {'null':null, 'true':true, 'false':false};

         defn.forEach(function(line)
         {
            line = line.trim();

            if (line.indexOf(':') < 1)
            { return; }

            prts = line.split('`').join('').split(':');
            name = prts[0].trim();
            data = prts[1].trim();
            data = (!isNaN(data) ? (data *1) : cnst.hasOwnProperty(data) ? cnst[data] : data);

            if (data[0] == '[')
            { data = data.substr(1,(data.length -2)).split(','); }

            resl[name] = data;
         });

         return resl;
      },


      js:function(defn)
      { return require(defn); },


      njs:function(defn)
      { return require(defn); },


      json:function(defn)
      { return require(defn); },


      conf:function(defn)
      { return this['v'](defn); },
   });
// --------------------------------------------------------------------------------------------------------





// glob :: Path
// --------------------------------------------------------------------------------------------------------
   Main.Path = // object
   {
      Access:function(path,func)
      {
         var temp,resl='';

         path = path.split('//').join('/');

         if (!func)
         {
            try{Fsys.accessSync(path,Fsys.F_OK); resl+='f';}catch(e){return false;}
            try{Fsys.accessSync(path,Fsys.R_OK); resl+='r';}catch(e){return resl;}
            try{Fsys.accessSync(path,Fsys.W_OK); resl+='w';}catch(e){return resl;}
            try{Fsys.accessSync(path,Fsys.X_OK); resl+='x';}catch(e){return resl;}

            return resl;
         }

         Fsys.access(path,Fsys.F_OK,(fail)=>
         {
            if (fail){ func(false); return; }
            resl += 'f';

            Fsys.access(path,Fsys.R_OK,(fail)=>
            {
               if (fail){ func(resl); return; }
               resl += 'r';

               Fsys.access(path,Fsys.W_OK,(fail)=>
               {
                  if (fail){ func(resl); return; }
                  resl += 'w';

                  Fsys.access(path,Fsys.X_OK,(fail)=>
                  {
                     func((fail ? resl : (resl+'x')));
                  });
               });
            });
         });
      },


      Exists:function(path,func)
      {
         if (!func)
         { return (Path.Access(path) ? true : false); }

         Path.Access(path,function(auth)
         { func((auth ? true : false)); });
      },


      Browse:function(path,func)
      {
         var auth,stat,type,resl;

         if (!func)
         {
            auth = Path.Access(path);
            if (!auth || (auth == 'f')){ return undefined; }

            stat = Fsys.lstatSync(path);
            type = (stat.isDirectory() ? 'fold' : (stat.isFile() ? 'file' : null));

            return (!type ? null : ((type=='fold') ? Fsys.readdirSync(path) : Fsys.readFileSync(path,'utf8')));
         }

         Path.Access(path,function(auth)
         {
            if (!auth || (auth == 'f')){ func(undefined); return; }

            Fsys.lstat(path,function(fail,stat)
            {
               type = (stat.isDirectory() ? 'fold' : (stat.isFile() ? 'file' : null));
               if (!type){ func(null); return; }

               if (type == 'fold')
               {
                  Fsys.readdir(path,function(fail,list){ func(list); });
                  return;
               }

               Fsys.readFile(path,'utf8',function(fail,data){ func(data); });
            });
         });
      },
   };
// --------------------------------------------------------------------------------------------------------
