
////////////////////////////////////////////
// Acquired Bootstrapper Environment Core //
////////////////////////////////////////////



// note :: important : read this
// --------------------------------------------------------------------------------------------------------
// this file provides the basis upon wich other JS apps are built, server-side & client-side
// please note that this file should load only once-per-session - not on every request
// read the documentation carefully before hacking here, it explains the reasoning behind all this
// everything in this file is important, so, edit it carefully, else error-handling may become useless
// --------------------------------------------------------------------------------------------------------



// glob :: Main
// --------------------------------------------------------------------------------------------------------
   'use strict';                    // strict mode    :: prevent nasty surprises
   global.Main = global;            // super-global   :: refers `global` -or- `window`

   Main.MODE = 'DEVL';              // runtime mode   :: DEVL, LIVE
   Main.VOID = (void 0);            // undefined      :: paranoia
   Main.ROLE = (Main.document ? 'GUI' : ((Main.process && Main.process.stdout.isTTY) ? 'CLI' : 'API'));

   Main.Host = require('os');
   Main.View = {};
   Main.Fsys = require('fs');
   Main.Http = require('http');
   Main.Sock = require('ws');
   Main.Exec = require('child_process').exec;

   Host.IPv4Addr = (function(list)
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
// --------------------------------------------------------------------------------------------------------





// shim :: (polyfill) : provide & standardize mandatory functionality - before debug
// --------------------------------------------------------------------------------------------------------
   (function()
   {
   // glob :: func : dataType - identify variable-data-types -- may be required from here on
   // -----------------------------------------------------------------------------------------------------
      Main.dataType = function(data)
      {
         var type = (({}).toString.call(data).match(/\s([a-zA-Z]+)/)[1].toLowerCase());

         if (['undefined','null'].indexOf(type) > -1){ return type; }
         if (['global','window'].indexOf(type) > -1){ return 'supreme'; }
         if (type.indexOf('element') > -1){ return 'element'; }
         if (type.indexOf('collection') > -1){ return 'nodelist'; }
         if (!data.__proto__  || ((type!='object') && (type!='arguments') && !data.__proto__.__proto__))
         { return ('proto-'+type); }

         return type;
      }
   // -----------------------------------------------------------------------------------------------------




   // util :: LZString : compatible with IE7+ : manual @ http://pieroxy.net/blog/pages/lz-string/index.html
   // -----------------------------------------------------------------------------------------------------
      Main.LZString=function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return"";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return"";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else{if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u)}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var t,i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(t=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return"";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else{if(l!==d)return null;v=s+s.charAt(0)}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module&&(module.exports=LZString);
   // -----------------------------------------------------------------------------------------------------




   // glob :: Codx : extensible codex library - needed for debug
   // -----------------------------------------------------------------------------------------------------
      Main.Codx = // node
      {
         auto:'LZSB64',

         LZSB64:  // LZString
         {
            encode:function(text)
            { return LZString.compressToBase64(text); },

            decode:function(text)
            { return LZString.decompressFromBase64(text); }
         },
      };


      Main.Encode = function(defn)
      { return (Codx[defn] ? Codx[defn].encode : Codx[Codx.auto].encode(defn)); };

      Main.Decode = function(defn)
      { return (Codx[defn] ? Codx[defn].decode : Codx[Codx.auto].decode(defn)); };
   // -----------------------------------------------------------------------------------------------------
   }());
// --------------------------------------------------------------------------------------------------------





// glob :: func : Extend - extends any extensibles
// --------------------------------------------------------------------------------------------------------
   Object.defineProperty(Main,'Extend',
   {
      writable:false,
      enumerable:false,
      configurable:false,

      value:function()
      {
      // args :: lexical scope inheritance in return closure below
      // --------------------------------------------------------------------------------------------------
         var args = [].slice.call(arguments);
         var glob = ((dataType(args[0]) === 'supreme') ? true : false);
      // --------------------------------------------------------------------------------------------------



      // echo :: func : to call with object
      // --------------------------------------------------------------------------------------------------
         return function(defn,lock)
         {
         // dbug :: must be object
         // -----------------------------------------------------------------------------------------------
            if (dataType(defn) != 'object'){ throw 'expecting dataType: `object`'; }
         // -----------------------------------------------------------------------------------------------


         // each :: defn : item
         // -----------------------------------------------------------------------------------------------
            for (var item in defn)
            {
            // vars :: local : skip irrelevant
            // --------------------------------------------------------------------------------------------
               var name,tpof,name,spec,meta;

               if (!defn.hasOwnProperty(item)){ continue; }

               name = item;
               item = defn[item];
               tpof = dataType(item);
               spec = {};
               meta =
               {
                  AS:VOID,
                  ON:{get:VOID, set:VOID},
                  IS:{writable:false, enumerable:false, configurable:false}
               };
            // --------------------------------------------------------------------------------------------


            // make :: extension object from defaults
            // --------------------------------------------------------------------------------------------
               if (((tpof!='object') && (tpof!='function')) || (!item.AS && !item.ON && !item.IS))
               { meta.AS=item;  item=meta; }
            // --------------------------------------------------------------------------------------------


            // --------------------------------------------------------------------------------------------
               for (var i in meta)
               {
                  if (!meta.hasOwnProperty(i)){ continue; }
                  if (!(i in item)){ item[i] = meta[i]; }
                  if (i == 'AS'){ spec.value=item[i]; continue; }

                  for (var o in meta[i])
                  {
                     if (!(o in item[i])){ item[i][o] = meta[i][o]; }
                     if (item[i][o] !== VOID){ spec[o] = item[i][o]; }
                  }
               }
            // --------------------------------------------------------------------------------------------


            // --------------------------------------------------------------------------------------------
               if (spec.set || spec.get){ delete(spec.value); delete(spec.writable); }
               // if (glob){ Defined[Defined.length] = name; }

               for (var i in args)
               {
                  if (args.hasOwnProperty(i))
                  { Object.defineProperty(args[i],name,spec); }
               }
            // --------------------------------------------------------------------------------------------
            }
         // -----------------------------------------------------------------------------------------------
         };
      // --------------------------------------------------------------------------------------------------
      }
   });
// --------------------------------------------------------------------------------------------------------





// glob :: func : Define - global entities
// --------------------------------------------------------------------------------------------------------
   Extend(Main)
   ({
      Define:function(Defn)
      {
         if (dataType(Defn) == 'object')
         {
            Extend(Main)(Defn,true);
            return true;
         }

         throw 'expecting dataType: `object`';
      },
   });
// --------------------------------------------------------------------------------------------------------





// glob :: constants : `Define` these so they are immutable and not-enumerable
// --------------------------------------------------------------------------------------------------------
   Define
   ({
      VOID:VOID,
      ROLE:ROLE,

      FALS:false,
      NONE:null,
      TRUE:true,
   });

   (function(list,defn)
   {
      list=list.split(',');  defn={};
      for (var i in list){ if (list.hasOwnProperty(i)){ defn[list[i]] = ('⋖'+list[i]+'⋗'); } }
      Extend(Main)(defn);
   }// these (below) are `system words` which compliment functionality
   ('AUTO,DROP,DUPL,UPPR,LOWR,CAML,NEXT,DONE,KEYS,VALS,BFOR,AFTR,EVEN,ODDS,PULL,PUSH'));
// --------------------------------------------------------------------------------------------------------





// glob :: func : (essentials)
// --------------------------------------------------------------------------------------------------------
   Define
   ({
   // glob :: func : Exit - throw special error that simply halts execution
   // -----------------------------------------------------------------------------------------------------
      Exit:function(stat)
      {
         if (ROLE == 'GUI')
         { throw '<[EXIT]>'+(stat || 'exit'); }
         else
         { process.exit((stat ? 1 : 0)); }
      },
   // -----------------------------------------------------------------------------------------------------




   // glob :: func : dump - console.log -- `Dump` does `dump` + `Exit`
   // -----------------------------------------------------------------------------------------------------
      dump:function()
      { console.log.apply(console,[].slice.call(arguments)); },

      Dump:function()
      {
         dump.apply(null,[].slice.call(arguments));
         Exit();
      },
   // -----------------------------------------------------------------------------------------------------




   // Keys : returns a list of keys of anything - empty list if no keys
   // -----------------------------------------------------------------------------------------------------
      Keys:function(data,indx)
      {
         var tpod = dataType(data);
         var resl = [];

         if (['undefined','null','boolean'].indexOf(tpod) > -1)
         { return []; }

         if (['number','string'].indexOf(tpod) > -1)
         { data = (data+'').split(''); }
         else if ((tpod == 'arguments') || (tpod == 'html-nodelist'))
         { data = [].slice.call(data); }
         else if (tpod == 'date')
         {
            // TODO Date
            return [];
         }

         resl = Object.keys(data);

         if ((indx === VOID) || (indx === null))
         { return resl; }

         return resl[((indx < 0) ? (resl.length -1) : indx)];
      },

      keysOf:function(data,indx){ return Keys(data,indx); },
   // -----------------------------------------------------------------------------------------------------




   // range : create list from a number, or between 2 numbers
   // -----------------------------------------------------------------------------------------------------
      range:function(begn,endn)
      {
         var resl = [];
         var temp;

         if (endn === VOID)
         { endn=begn; begn=1; }

         if ((dataType(begn) != 'number') || (dataType(endn) != 'number'))
         { throw 'expecting dataType: `number`'; }

         if (begn < endn)
         { for (begn; begn<=endn; begn++){ resl[resl.length] = begn; } }
         else
         { for (endn; endn<=begn; begn--){ resl[resl.length] = begn; } }

         return resl;
      },
   // -----------------------------------------------------------------------------------------------------




   // Each : like forEach but with cleaner syntax and more versatile
   // -----------------------------------------------------------------------------------------------------
      Each:function(d,f)
      {
         var t = dataType(d);

         if (t == 'number'){ d = range(d); t='array'; }
         if (dataType(f) != 'function'){ throw 'function expected'; }

         for (var k in d)
         {
            k = ((t != 'array') ? k : (!isNaN(k) ? (k*1) : k));
            if (!d.hasOwnProperty(k) || ((k+'').length < 1)){ continue; }
            var z = f.apply(d,[d[k],k]);
            if ((z !== VOID) && (z !== NEXT)){ break; }
         }
      },
   // -----------------------------------------------------------------------------------------------------




   // Vals : returns a list of values of anything - empty list if no values
   // -----------------------------------------------------------------------------------------------------
      Vals:function(data,indx)
      {
         var resl = [];

         Each(data,function(item)
         { resl[resl.length] = item; });

         if ((indx === VOID) || (indx === null))
         { return resl; }

         return resl[((indx < 0) ? (resl.length -1) : indx)];
      },

      valsOf:function(data,indx){ return Vals(data,indx); },
   // -----------------------------------------------------------------------------------------------------




   // Span : returns the length of anything  .:  number=digits  float=decimals  bool=1/0
   // -----------------------------------------------------------------------------------------------------
      Span:function(data)
      {
         var tpof = dataType(data);

         if (!data)
         { return 0; }

         if ((tpof == 'number') && ((data+'').indexOf('.') > 0))
         { data = (data+'').split('.')[1]; }

         return Keys(data).length;
      },

      spanOf:function(data){ return Span(data); },
   // -----------------------------------------------------------------------------------------------------




   // Copy : duplicates anything
   // -----------------------------------------------------------------------------------------------------
      Copy:function(defn)
      {
         var copy,tpof;

         tpof = dataType(defn);

         if (!defn || (['boolean','number','string'].indexOf(tpof) > -1))
         { return defn; }

         if (tpof == 'date')
         {
            copy = new Date();
            copy.setTime(defn.getTime());

            return copy;
         }

         if ((['array','object','function'].indexOf(tpof) > -1))
         {
            copy = ((tpof=='array')?[]:((tpof=='object')?{}:function(){return defn.apply(this,arguments)}));

            for (var i in defn)
            { copy[i] = Copy(defn[i]); }

            return copy;
         }

         return;
      },

      copyOf:function(defn){ return Copy(defn); },
   // -----------------------------------------------------------------------------------------------------




   // glob :: func : Time
   // -----------------------------------------------------------------------------------------------------
      Time:function(defn)
      {
         var type;

         defn = (defn || 0);
         type = dataType(defn);

         if (type == 'number')
         { return ((new Date()).getTime() + defn); }

         if (type == 'string')
         { return (new Date(defn)).getTime(); }

         if (type == 'date')
         { return defn.getTime(); }

         return VOID;
      },

      timeOf:function(defn)
      {
         return Time(defn);
      },
   // -----------------------------------------------------------------------------------------------------




   // glob :: func : Char - get ascii/unicode character from int -or- hex
   // -----------------------------------------------------------------------------------------------------
      Char:function(defn)
      {
         var type,unit;

         type = dataType(defn);

         if ((type != 'number') && (type != 'string'))
         { return NONE; }

         unit = (((defn+'').length < 4) ? parseInt(defn) : parseInt(defn,16));

         if (isNaN(unit) || (unit > 65535))
         { return NONE; }

         return String.fromCharCode(unit);
      },

      charOf:function(defn){ return Char(defn); },
   // -----------------------------------------------------------------------------------------------------




   // Size : in KB, MB, GB
   // -----------------------------------------------------------------------------------------------------
      Size:function(size,unit)
      {
         if (!((typeof size) == 'number') || ((size+'').indexOf('.') > -1))
         { throw 'expecting typeOf: FLATUNIT'; }

         if (unit == 'GB')
         { return (+(1073741824 / size).toFixed(2)); }

         if (unit == 'MB')
         { return (+(1048576 / size).toFixed(2)); }

         if (unit == 'KB')
         { return (+(1024 / size).toFixed(2)); }

         return size;
      },

      sizeOf:function(size,unit){ return Size(size,unit); },
   // -----------------------------------------------------------------------------------------------------




   // Diff : difference
   // -----------------------------------------------------------------------------------------------------
      Diff:function(a,b)
      {
         var typa = dataType(a);
         var typb = dataType(b);
         var resl;

         if (typa != typb){ throw 'dataType mismatch'; }

         if (typa == 'array')
         {
            resl = [];

            a.Each = function(i){ if (b.indexOf(i)<0){ resl[resl.length] = i; } };
            b.Each = function(i){ if (a.indexOf(i)<0){ resl[resl.length] = i; } };

            return resl;
         }
      },

      diffOf:function(a,b){ return Diff(a,b); },
   // -----------------------------------------------------------------------------------------------------



   // glob :: func : Find - (needle,haystack,offset) -- return array[key,needle] - or null if not found
   // -----------------------------------------------------------------------------------------------------
      Find:function(nedl,hays,offs,kvon)
      {
         var near;
         var tpon = dataType(nedl);
         var tpoh = dataType(hays);
         var find = null;
         var resl = null;

         offs = (offs || 0);
         kvon = ((kvon || VALS)).substr(1,4);
         kvon = (kvon[0].toUpperCase() + kvon.substr(1).toLowerCase());
         near = {};


         if ((['number','string','array','object','function'].indexOf(tpoh) < 0))
         { return null; }

         if (tpon != 'array')
         { nedl = (((tpon == 'string') || (tpon == 'number')) ? [nedl+''] : Main[kvon](nedl)); }

         if (tpoh == 'number')
         {
            hays = (hays+'');
            tpoh = 'string';
         }


         if (tpoh == 'string')
         {
            hays = hays.substr(offs);

            nedl.Each = function(nv,ni)
            {
               if (nv.length < 1){ return; }
               find = hays.indexOf(nv+'');
               if (find > -1){ near[find] = nv; }
            };
         }
         else
         {
            hays.Each = function(hv,hi)
            {
               nedl.Each = function(nv,ni)
               {
                  if (nv === hv)
                  { near[hi] = nv; }
               };
            };
         }

         if (Span(near) < 1){ return null; }

         near.Each = function(nedl,indx)
         {
            if (!isNaN(indx)){ indx = (indx *1); }
            if (resl === null){ resl = indx; return; }
            if (indx < resl){ resl = indx; }
         };

         return [resl,near[resl]];
      },
   // -----------------------------------------------------------------------------------------------------
   });
// --------------------------------------------------------------------------------------------------------





// meta :: glob - extend all protoypes with these
// --------------------------------------------------------------------------------------------------------
   Extend
   (
      Boolean.prototype,
      Number.prototype,
      String.prototype,
      Array.prototype,
      Object.prototype,
      Function.prototype,
      Date.prototype
   )
   ({
   // func :: Each : like forEach but cleaner and more versatile
   // -----------------------------------------------------------------------------------------------------
      Each:
      {
         ON:
         {
            set:function(func)
            { Each(this,func); }
         }
      },
   // -----------------------------------------------------------------------------------------------------




   // func :: Find
   // -----------------------------------------------------------------------------------------------------
      Find:function(nedl,offs,kvon,near)
      {
         return Find(nedl,this,offs,kvon,near);
      },
   // -----------------------------------------------------------------------------------------------------




   // func :: Keys
   // -----------------------------------------------------------------------------------------------------
      Keys:function()
      {
         var args = Vals(arguments);
         var span = args.length;
         var data = Keys(this);
         var list = [];

         args.Each = function(v)
         {
            v = ((v < 0) ? (data.length -1) : v);

            if (data.hasOwnProperty(v))
            { list[list.length] = data[v]; }
         };

         return ((span < 1) ? data : ((span < 2) ? list[0] : list));
      },
   // -----------------------------------------------------------------------------------------------------




   // func :: Vals
   // -----------------------------------------------------------------------------------------------------
      Vals:function(indx)
      {
         var args = Vals(arguments);
         var span = args.length;
         var data = Vals(this);
         var list = [];

         args.Each = function(v)
         {
            v = ((v < 0) ? (data.length -1) : v);

            if (data.hasOwnProperty(v))
            { list[list.length] = data[v]; }
         };

         return ((span < 1) ? data : ((span < 2) ? list[0] : list));
      },
   // -----------------------------------------------------------------------------------------------------
   });
// --------------------------------------------------------------------------------------------------------





// meta :: func : extends array, object, function
// --------------------------------------------------------------------------------------------------------
   Extend(Array.prototype, Object.prototype, Function.prototype)
   ({
   // Join : merge together, minding closures & duplicates
   // -----------------------------------------------------------------------------------------------------
      Join:function(data)
      {
      // --------------------------------------------------------------------------------------------------
         var self,tpos,tpod;

         self = this;
         tpos = dataType(self);
         tpod = dataType(data);
      // --------------------------------------------------------------------------------------------------



      // --------------------------------------------------------------------------------------------------
         if (tpos == 'array')
         {
            if ((tpod == 'function') || (tpod == 'object'))
            { return data.Join(self); }

            data.Each = function(item,name)
            {
               if (isNaN(name *1))
               {
                  if (self.hasOwnProperty(name))
                  { return; }

                  self[name] = item;
               }
               else
               {
                  if (self.indexOf(item) < 0)
                  { self[self.length] = item; }
               }
            };

            return self;
         }
      // --------------------------------------------------------------------------------------------------



      // --------------------------------------------------------------------------------------------------
         if (tpos == 'object')
         {
            if ((tpod == 'object') || (tpod == 'array'))
            {
               data.Each = function(item,name)
               {
                  if (!self.hasOwnProperty(name))
                  { self[name] = item; }
               };

               return self;
            }

            if (tpod == 'function')
            {
               self = data;
               data = this;
               tpos = tpod;
               tpod = dataType(data);
            }
         }
      // --------------------------------------------------------------------------------------------------



      // --------------------------------------------------------------------------------------------------
         if (tpos == 'function')
         {
            if ((tpod == 'object') || (tpod == 'array'))
            {
               data.Each = function(item,name)
               {
                  if (!self.hasOwnProperty(name))
                  { self[name] = item; }
               };

               self = self.bind(self);

               data.Each = function(item,name)
               {
                  if (!self.hasOwnProperty(name))
                  { self[name] = item; }
               };
            }

            return self;
         }
      // --------------------------------------------------------------------------------------------------



      // --------------------------------------------------------------------------------------------------
         return self;
      // --------------------------------------------------------------------------------------------------
      },
   // -----------------------------------------------------------------------------------------------------
   });
// --------------------------------------------------------------------------------------------------------





// meta :: func : (search)
// --------------------------------------------------------------------------------------------------------
   Extend(Number.prototype, String.prototype, Array.prototype, Object.prototype, Function.prototype)
   ({
   // Has - check if self has keys or values (in args -or- list)  ::  0=none  1=all  float=some
   // -----------------------------------------------------------------------------------------------------
      Has:function()
      {
         var self,args,span,incr,tpos,kvon;

         self = this;
         args = ((dataType(arguments[0]) == 'array') ? arguments[0] : [].slice.call(arguments));

         span = args.length;
         incr = 0;
         tpos = dataType(self);
         kvon = VALS;

         if (span < 1)
         { return 0; }

         if ((args[0] == KEYS) || (args[0] == VALS))
         {
            kvon = args.shift();
            // args = args[0][kvon];
         }
         else
         {
            if ((tpos == 'object') || (tpos == 'function'))
            { kvon = KEYS; }
         }

         if (kvon == KEYS)
         {
            if ((tpos == 'object') || (tpos == 'function'))
            {
               self = Object.keys(self);
               tpos = 'array';
               kvon = VALS;
            }
            else if (tpos == 'string')
            {
               self = self.split();
               tpos = 'array';
            }
         }

         args.Each = function(item)
         {
            if ((kvon == VALS) && (tpos == 'string') && (self.indexOf(item) > -1))
            { incr++; return; }

            self.Each = function(data,name)
            {
               if (((kvon == KEYS) && (item == name)) || ((kvon == VALS) && (item == data)))
               { incr++; }
            };
         };

         return ((incr.length < 1) ? 0 : (+(incr / span).toFixed(2)));
      },
   // -----------------------------------------------------------------------------------------------------




   // (misc) : `Has` - support functions
   // -----------------------------------------------------------------------------------------------------
      hasKey:function()
      {
         var args = [].slice.call(arguments); args.unshift(KEYS);
         return (this.Has.apply(this,args) ? true : false);
      },

      hasVal:function(defn)
      {
         var args = [].slice.call(arguments); args.unshift(KEYS);
         return (this.Has.apply(this,args) ? true : false);
      },

      hasAny:function()
      { return (this.Has.apply(this,[].slice.call(arguments)) ? true : false); },

      hasAll:function()
      { return ((this.Has.apply(this,[].slice.call(arguments)) === 1) ? true : false); },
   // -----------------------------------------------------------------------------------------------------
   });
// --------------------------------------------------------------------------------------------------------





// meta :: func : String
// --------------------------------------------------------------------------------------------------------
   Extend(String.prototype)
   ({
   // Chop : `by number` -or- `by char` -or- `by list` -- (`by list` includes list items)
   // -----------------------------------------------------------------------------------------------------
      Chop:function(defn)
      {
         var self = this.toString();
         var type = dataType(defn);
         var resl = [];
         var indx;


         if (type == 'number')
         {
            var regx = new RegExp('.{1,' + defn + '}', 'g');
            return self.match(regx);
         }


         if (type == 'string')
         { return self.split(defn); }


         if (type == 'array')
         {
            defn.Each = function(item)
            {
               indx = self.indexOf(item);
               if (indx < 0){ return; }

               resl[resl.length] = self.substr(0,indx);
               resl[resl.length] = item;

               self = self.substr((indx + item.length));
            };

            if (self.length > 0)
            { resl[resl.length] = self; }

            return resl;
         }


         return [self];
      },
   // -----------------------------------------------------------------------------------------------------



   // Trim : trim off white-space -or characters
   // -----------------------------------------------------------------------------------------------------
      Trim:function(defn)
      {
         var self = this.toString();
         var type = dataType(defn);

         if (!defn)
         { return self.trim(); }

         if (type == 'number')
         { return self.substr(defn, ((self.length - defn) - defn)); }

         if (type == 'string')
         {
            if (self.substr((0 - defn.length)) == defn)
            { self = self.substr(0, (self.length - defn.length)); }

            if (self.substr(0,defn.length) == defn)
            { self = self.substr(defn.length); }

            return self;
         }

         return self;
      },

      trimOf:function(defn)
      {
         var self = this.toString();
         var resl = self.Trim(defn);

         return (self.split(resl).join(''));
      },
   // -----------------------------------------------------------------------------------------------------



   // Swap : replace
   // -----------------------------------------------------------------------------------------------------
      Swap:function(find,repl)
      {
         var self,ftyp,rtyp,ritm,ridx;

         self = this.toString();
         find = (find || '');
         repl = (repl || '');
         ftyp = typeOf(find);
         rtyp = typeOf(repl);

         if ((ftyp == TEXT) && (rtyp == TEXT))
         { return (self.split(find).join(repl)); }
         else
         {
            if (ftyp == NODE)
            {
               repl = Vals(find);
               find = Keys(find);
               rtyp = LIST;
            }
            else
            { find = ((ftyp == LIST) ? find : [find]); }
         }


         if (rtyp == LIST)
         {
            ridx = repl.Keys(-1);
            repl.Each = function(item,indx)
            { repl[indx] = textOf(item); };
         }
         else
         { repl = textOf(repl); }


         find.Each = function(item,indx)
         {
            item = textOf(item);
            ritm = ((rtyp==LIST) ? (repl[indx] || repl[ridx]) : repl);
            self = (self.split(item).join(ritm));
         };

         return self;
      },
   // -----------------------------------------------------------------------------------------------------



   // spanOf : count substring ocurrences
   // -----------------------------------------------------------------------------------------------------
      spanOf:function(data)
      {
         if (!isText(data) || (data.length < 1))
         { return 0; }

         var self = this.toString();
         var prts = self.split(data);

         return (prts.length -1);
      },
   // -----------------------------------------------------------------------------------------------------



   // caseTo : change case to upper/lower/camelback
   // -----------------------------------------------------------------------------------------------------
      caseTo:function(optn)
      {
         var self,prts;

         self = this.toString().toLowerCase();

         if (optn == LOWR){ return self; }
         if (optn == UPPR){ return self.toUpperCase(); }

         if (optn == CAML)
         {
   			prts = self.split('_').join('-').split(' ').join('-').split('.').join('-').split('/').join('-');
   			prts = self.split('-');

            prts.Each = function(item,indx)
            {
               if (indx < 1){ prts[indx] = item.toLowerCase(); return; }
               prts[indx] = (item.substr(0,1).toUpperCase() + item.substr(1));
            };

   			return (prts.join(''));
         }

         if (optn == LABL)
         {
            prts = self.split('  ').join(' ').split(' ');

            prts.Each = function(item,indx)
            { prts[indx] = (item.substr(0,1).toUpperCase() + item.substr(1).toLowerCase()); };

   			return (prts.join(''));
         }

         return self;
      },
   // -----------------------------------------------------------------------------------------------------



   // caseIs : checks if case is upper/lower
   // -----------------------------------------------------------------------------------------------------
      caseIs:function(optn)
      {
         var self = this.toString();

         if (!isNaN(self) && ([LOWR,UPPR,CAML,LABL].Has(optn)))
         { return ((self == self.caseTo(optn)) ? true : false); }

         return VOID;
      },
   // -----------------------------------------------------------------------------------------------------



   // parse : simple parse
   // -----------------------------------------------------------------------------------------------------
      parse:function(defn)
      {
         var self,list,lcos,dlim,prts,resl;

         self = (this.toString()).trim();
         lcos = self.toLowerCase();

         if (lcos === 'undefined')
         { return VOID; }

         if ((lcos === '') || (lcos === 'null') || (lcos === 'none'))
         { return null; }

         if (!isNaN(self))
         { return (self *1); }

         if ([lcos].Has('true','yes','on','positive'))
         { return true; }

         if ([lcos].Has('false','no','off','negative'))
         { return false; }

         if ([(self[0] + self.substr(-1,1))].Has('()','[]','{}'))
         { return eval(self); }


         if (self.Has('?','&','='))
         {
            self = (((self[0] == '?') || (self[0] == '&')) ? self.substr(1) : self);
            prts = self.split('+').join(' ');
            prts = self.split('&');
            resl = {};

            prts.Each = function(item)
            {
               item = item.split('=');
               resl[item[0]] = (item[1] ? decodeURIComponent(item[1]) : '');
            };

            return resl;
         }


         if (self.Has('::',':',',',';'))
         {
            if (self.Has(';',','))
            {
               resl = ((self.Has(':') && !self.Has(';')) ? {} : []);
               dlim = (self.Has(';') ? ';' : ',');
               prts = self.split(dlim);

               prts.Each = function(item)
               {
                  if (!item)
                  { return; }

                  if (item.Has(':'))
                  {
                     prts = item.split(':');
                     resl[prts[0].trim()] = prts[1].parse();
                  }
                  else
                  { resl[resl.length] = item.parse(); }
               };

               return resl;
            }

            if (self.Has('::',':'))
            {
               resl = {};
               dlim = (self.Has('::') ? '::' : ':');
               prts = self.split(dlim);
               resl[prts[0].trim()] = prts[1].parse();

               return resl;
            }
         }

         return self;
      },
   // -----------------------------------------------------------------------------------------------------
   });
// --------------------------------------------------------------------------------------------------------





// glob :: func : typeOf - identify variable-data-types
// --------------------------------------------------------------------------------------------------------
   Define
   ({
      typeOf:function(data)
      {
         var type = dataType(data).substr(0,4);

         if (type == 'null')
         { type = 'bool'; }
         else
         { type = (type.Has('node','argu') ? 'arra' : (type.Has('html','elem') ? 'obje' : type)); }

         if (!this[type])
         { type = 'unde'; }

         return '⋖'+this[type]+'⋗';
      }
      .Join
      ({
         unde:'VOID',
         bool:'QBIT', // qubit :: [fals null true] :: [-1  0  +1]
         numb:'UNIT',
         stri:'TEXT',
         bina:'BLOB',
         arra:'LIST',
         obje:'NODE',
         func:'FUNC',
         date:'TIME',
         supr:'MAIN',
         prot:'PLAN',
      })
   });

   typeOf.Each = function(type)
   {
      if (type == 'VOID'){ return; }

      Define
      ({
         [type]:'⋖'+type+'⋗',
         ['is'+type[0]+type.substr(1).toLowerCase()]:function(data)
         { return ((typeOf(data) == this.Data) ? true : false); }.bind({Data:'⋖'+type+'⋗'})
      });
   };

   Define
   ({
      Type:function(data){ return typeOf(data); },
      isVoid:function(data){ return ((data === VOID) ? true : false); },
   });
// --------------------------------------------------------------------------------------------------------





// glob :: func : to[Type] -- cast any data-type to a relative representation of another data-type
// --------------------------------------------------------------------------------------------------------
   Extend(Main)
   ({
      voidOf:function()
      { return VOID; },


      qbitOf:function(defn)
      {
         var type = typeOf(defn);
         var list;

         if (type == QBIT)
         { return defn; }

         if (type == TEXT)
         {
            list = 'fals,false,no,off,fail,negative';
            if (list.split(',').Has(defn) || list.toUpperCase().split(',').Has(defn))
            { return false; }

            list = 'none,null';
            if (list.split(',').Has(defn) || list.toUpperCase().split(',').Has(defn))
            { return null; }

            list = 'true,yes,on,done,positive';
            if (list.split(',').Has(defn) || list.toUpperCase().split(',').Has(defn))
            { return true; }
         }

         if (type != UNIT)
         { defn = Span(defn); }

         return ((defn < 0) ? false : ((defn < 1) ? null : true));
      },


      unitOf:function(defn)
      {
         var type = typeOf(defn);

         if (type == UNIT)
         { return defn; }

         if (type == QBIT)
         { return ((defn === false) ? -1 : ((defn === null) ? 0 : 1)); }

         return Span(defn);
      },


      textOf:function(defn)
      {
         var type = typeOf(defn);

         if ([VOID,MAIN,PLAN].Has(type))
         { defn=type; type=TEXT; }

         if (type == TEXT)
         { return ((defn.trimOf(1) == '⋖⋗') ? defn.Trim(1) : defn); }

         if (type == QBIT)
         { return ((defn === false) ? 'false' : ((defn === null) ? 'null' : 'true')); }

         if ([FUNC,TIME].Has(type))
         { defn.toStrng(); }

         return JSON.stringify(defn);
      },


      listOf:function(defn)
      {
         var type = typeOf(defn);
         var flcp,dlim;

         if (type == LIST)
         { return (['arguments','nodelist'].Has(dataType(defn)) ? [].slice.call(defn) : Copy(defn)); }

         if (type == QBIT)
         { return ((defn === null) ? [] : [defn]); }

         if (type == UNIT)
         { return range(defn); }

         if (type == TEXT)
         {
            defn = defn.trim();
            dlim = defn.Find([';',',',' ','|']);

            if (['()','[]','{}'].Has(defn.trimOf(1)))
            {
               defn = eval(defn);
               return (isList(defn) ? defn : listOf(defn));
            }

            if (dlim)
            { return defn.split(dlim[1]); }

            return defn.split('');
         }

         if ([VOID,MAIN,PLAN].Has(type))
         { return []; }

         return Vals(defn);
      },


      nodeOf:function(defn)
      {
         var type = typeOf(defn);
         var resl = {};

         if ([NODE,TIME].Has(defn))
         { return Copy(defn); }

         if (type == QBIT)
         {
            resl[(unitOf(defn)+'')] = defn;
            return resl;
         }

         if (type == UNIT)
         { return nodeOf(range(defn)); }

         if (type == TEXT)
         {
            defn = defn.trim();

            if (['()','[]','{}'].Has(defn.trimOf(1)))
            { return nodeOf(eval(defn)); }

            if (defn.Has('?','&','=','::',';',':',','))
            { return nodeOf(defn.parse()); }

            return nodeOf(defn.split());
         }

         if (type == LIST)
         {
            defn.Each = function(item,indx)
            { resl[indx] = item; };

            return resl;
         }

         if (type == FUNC)
         {
            var text,indx,head,name,body,args,attr,data,f2lc,omit;

            text = defn.toString();
            indx = text.indexOf('{');
            head = text.substr(0,indx);
            name = ((head.substr(0,head.indexOf('(')).split('function ')[1].trim()) || VOID);
            head = (head.substr((head.indexOf('(')+1), (head.indexOf(')')-(head.indexOf('(')+1)))).split(',');
            body = text.substr((indx+1),((text.lastIndexOf('}')-indx) -1)).trim().split('\n');

            args = [];
            attr = {};
            data = [];

            if (name)
            { attr.Name = name; }

            defn.Each = function(val,key)
            { attr[key] = Copy(val); };

            head.Each = function(item)
            { args.Insert(item.trim()); };

            body.Each = function(line)
            {
               line = line.trim();
               f2lc = line.substr(0,2);

               if (line == '/*'){ omit=true; return; }
               if (omit){ if (line == '*/'){ omit=false; } return; }
               if ((line.length < 1) || (f2lc == '//') || ((f2lc == '/*') && (line.substr(-2,2) == '*/')))
               { return; }

               data.Insert(line);
            };

            if ((data.length < 2) && (data[0] == '[native code]'))
            { data[0] = '/* [native code] */'; }

            return {Type:type, Args:args, Attr:((Span(attr) > 0) ? attr : VOID), Data:data};
         }

         return {};
      },


      funcOf:function(defn)
      {
         var type = typeOf(defn);
         var resl;

         if (type == FUNC)
         { return Copy(defn); }

         if ([VOID,MAIN,PLAN].Has(type))
         { return function(){}; }

         if (type == NODE)
         {
            if (defn.Type != FUNC)
            { return defn.Join(function(){}); }

            resl = Function.apply(null,(defn.Args.Join(defn.Data)));

            if (defn.Args)
            {
               defn.Args.Each = function(val,key)
               { resl[key] = Copy(val); };
            }

            return resl;
         }

         return function(){ return this.Data; }.Join({Data:defn});
      },
   });
// --------------------------------------------------------------------------------------------------------





// glob :: func : kindOf - identify variable-data-kinds
// --------------------------------------------------------------------------------------------------------
   Define
   ({
      kindOf:function(data, type,kind)
      {
         type = typeOf(data).Trim(1);
         type = (!this[type] ? 'VOID' : type);


         this[type].Each = function(func,name)
         {

            if (func(data))
            {
               kind = name;
               return DONE;
            }
         };

         return ('⋖'+kind+type+'⋗');
      }
      .Join
      ({
         VOID:{ NULL:function(){ return 1; } },


         QBIT:
         {
            FALS:function(data){ return ((data === false) ? 1 : 0); },
            NONE:function(data){ return ((data === null) ? 0 : 1); },
            TRUE:function(data){ return ((data === true) ? 1 : 0); },
         },


         UNIT:
         {
            FLAT:function(data){ return (((data+'').indexOf('.') < 0) ? 1 : 0); },
            FRAC:function(){ return 1; },
         },


         TEXT:
         {
            VOID:function(data)
            {
               data = data.toLowerCase();

               if (['void','undefined','deleted','removed'].indexOf(data) > -1)
               { return true; }
            },

            UNIT:function(data){ if (!isNaN(data *1)){ return 1; } },
            CHAR:function(data){ if (data.length == 1){ return 1; } },

            QBIT:function(data,find)
            {
               data = data.toLowerCase();
               find = 'fals,false,no,off,fail,negative,'+
                      'none,null,'+
                      'true,yes,on,done,positive';

               if ((data.trim().length < 1) || (find.indexOf(data) > -1))
               { return true; }
            },

            QUOT:function(data){ if (data.trimOf(1).Has('``',"''",'""','‷‴')){ return 1; } },
            LIST:function(data){ if (data.trimOf(1) == '[]'){ return 1; } },
            NODE:function(data){ if (data.trimOf(1) == '{}'){ return 1; } },

            PATH:function(data){ if (data.Has('/') && (data.match(/^[a-zA-Z0-9-\/\.⁄_]+$/))){ return 1; } },
            REGX:function(data){ if (data.match(/^\/[\s\S]+\/$/)){ return 1; } },
            NAME:function(data){ if (data.match(/^[a-z][\w]{2,24}$/i)){ return 1; } },
            MAIL:function(data){if(data.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/)){return 1;}},
            CALC:function(data)
            {
               if ((data.trimOf(1) == '()') || data.match(/[-!$%^&*()+|~={}\[\]:;<>?,.\/]/))
               { return 1; }
            },

            FLAT:function(){ return 1; },
         },


         BLOB:
         {
            TINY:function(data){ if (Size(data.length,'MB') < 4){ return 1; } },
            NORM:function(data){ if (Size(data.length,'MB') < 16){ return 1; } },
            PHAT:function(data){ if (Size(data.length,'MB') < 64){ return 1; } },
            HUGE:function(data){ if (Size(data.length,'MB') < 256){ return 1; } },
            MEGA:function(){ return 1; },
         },


         LIST:
         {
            ARGS:function(data){ if (dataType(data) == 'arguments'){ return 1; } },
            NODE:function(data)
            {
               if ((dataType(data) == 'nodelist') || (dataType(data[0]).Has('obje','elem')))
               { return 1; }
            },
            META:function(){ return 1; },
         },

         NODE:
         {
            HTML:function(data){ if (dataType(data).Has('elem','html')){ return 1; } },
            META:function(){ return 1; },
         },

         FUNC:
         {
            META:function(data){ if (Object.keys(data).length < 1) return 1; },
            METH:function(){ return 1; },
         },

         TIME:
         { DATE:function(){ return 1; } },

         MAIN:
         { CORE:function(){ return 1; } },

         PLAN:
         {
            QBIT:function(data){ if (data === Boolean.prototype){ return 1; } },
            UNIT:function(data){ if (data === Number.prototype){ return 1; } },
            TEXT:function(data){ if (data === String.prototype){ return 1; } },
            LIST:function(data){ if (data === Array.prototype){ return 1; } },
            NODE:function(data){ if (data === Object.prototype){ return 1; } },
            FUNC:function(data){ if (data === Function.prototype){ return 1; } },
            DATE:function(data){ if (data === Date.prototype){ return 1; } },
            VOID:function(){ return 1; },
         },
      })
   });

   kindOf.Each = function(node,type)
   {
      node.Each = function(func,kind)
      {
         func = ('is'+kind[0]+kind.substr(1).toLowerCase()+type[0]+type.substr(1).toLowerCase());
         kind = (kind+type);

         Define
         ({
            [kind]:'⋖'+kind+'⋗',
            [func]:function(data)
            { return ((kindOf(data) == this.Data) ? true : false); }.bind({Data:'⋖'+kind+'⋗'})
         });
      };
   };
// --------------------------------------------------------------------------------------------------------





// glob :: meta : Tunnel - depth map - get/set/rip dot-separated property-depth
// --------------------------------------------------------------------------------------------------------
   Extend(Array.prototype, Object.prototype, Function.prototype)
   ({
      Tunnel:function(path,data)
      {
         var prts,refr,type,last;

         if (!isText(path) && !isList(path))
         { throw 'expecting typeOf: TEXT -or- LIST'; }

         prts = (isList(path) ? path : path.Chop('.'));
         refr = this;
         type = typeOf(refr);
         last = (prts.length -1);


         prts.Each = function(part,indx)
         {
            if ((!isText(part) && !isUnit(part)) || (Span(part) < 1))
            { throw 'invalid depth-map'; }

            if (data === VOID)
            {
               if (refr.hasOwnProperty(part))
               { refr = refr[part]; }
               else
               { refr = data;  return DONE; }

               return;
            }

            if (indx < last)
            {
               if (refr.hasOwnProperty(part))
               { refr = refr[part];  return; }

               if ((data != DROP) && (data != VOID))
               {
                  refr[part] = ((type == LIST) ? [] : {});
                  refr = refr[part];
                  return;
               }

               return DONE;
            }

            if ((data == DROP) || (data == VOID))
            { delete(refr[part]); }
            else
            { refr[part] = data; }
         };


         if (data === VOID)
         { return refr; }

         return this;
      },
   });
// --------------------------------------------------------------------------------------------------------





// glob :: (meta) functions
// --------------------------------------------------------------------------------------------------------
   Extend(Object.prototype,Array.prototype)
   ({
   // func :: Insert
   // -----------------------------------------------------------------------------------------------------
      Insert:function(defn)
      {
         var self = this;
         var kind = kindOf(self);
         var type;

         if (kind == METALIST)
         {
            self[self.length] = defn;
            return self;
         }

         if (kind == METANODE)
         {
            if (!self.Data){ self.Data = []; }
            self.Data[self.Data.length] = defn;
         }

         return self;
      },
   // -----------------------------------------------------------------------------------------------------



   // func :: Modify
   // -----------------------------------------------------------------------------------------------------
      Modify:function(defn)
      {
         var self = this;
         var type = typeOf(defn);

         if (!type.hasAny(NODE,LIST))
         { return self; }

         defn.Each = function(val,key)
         { self[key] = val; };

         return self;
      },
   // -----------------------------------------------------------------------------------------------------



   // func :: Select
   // -----------------------------------------------------------------------------------------------------
      Select:function()
      {
         var args,self,kind,resl,cmnd,defn,char,find;

         args = listOf((isList(arguments[0]) ? arguments[0] : arguments));
         self = (this || {});
         kind = kindOf(self);
         resl = [];

         if (Span(self) < 1){ return resl; }

         args.Each = function(item)
         {
            item = (self.hasKey(item) ? item : (item+''));
            if (self.hasKey(item))
            { resl[resl.length] = self[item]; }
         };

         return resl;
      },
   // -----------------------------------------------------------------------------------------------------



   // func :: Select
   // -----------------------------------------------------------------------------------------------------
      Delete:function()
      {
         var args,self,kind;

         args = listOf((isList(arguments[0]) ? arguments[0] : arguments));
         self = (this || {});
         kind = kindOf(self);

         args.Each = function(find)
         {
            if (self.hasKey(find))
            { delete(self[find]); }
         };

         return self;
      },
   // -----------------------------------------------------------------------------------------------------
   });
// --------------------------------------------------------------------------------------------------------





// glob :: func : pathBase, pathExtn, Path.Read
// --------------------------------------------------------------------------------------------------------
   Define
   ({
      Path:
      {
         Base:function(path)
         {
            if (!isPathText(path))
            { throw 'expecting kindOf: PATHTEXT'; }

            return path.split('/').pop().split('.')[0];
         },


         Extn:function(path)
         {
            if (!isPathText(path))
            { throw 'expecting kindOf: PATHTEXT'; }

            return path.split('.').pop();
         },


         Auth:function(path,func)
         {
            if (!isPathText(path))
            { throw 'expecting kindOf: PATHTEXT'; }

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


         Type:function(path)
         {
            if (!isPathText(path))
            { throw 'expecting kindOf: PATHTEXT'; }

            var auth = Path.Auth(path);
            var stat = (auth ? Fsys.lstatSync(path) : VOID);
            var type = (auth ? (stat.isDirectory() ? 'fold' : (stat.isFile() ? 'file' : 'path')) : VOID);

            return type;
         },


         Size:function(path)
         {
            if (!isPathText(path))
            { throw 'expecting kindOf: PATHTEXT'; }

            var auth = Path.Auth(path);
            var stat = (auth ? Fsys.lstatSync(path) : VOID);
            var type = (auth ? (stat.isDirectory() ? 'fold' : (stat.isFile() ? 'file' : 'path')) : VOID);

            if (!auth || !type.hasAny('fold','file'))
            { return VOID; }

            return ((type=='fold') ? ((Fsys.readdirSync(path)).length) : stat.size);
         },


         IsAt:function(path,func)
         {
            if (!isPathText(path))
            { throw 'expecting kindOf: PATHTEXT'; }

            if (!func)
            { return (Path.Auth(path) ? true : false); }

            Path.Auth(path,function(auth)
            { func((auth ? true : false)); });
         },


         Read:function(path,func)
         {
            if (!isPathText(path))
            { throw 'expecting kindOf: PATHTEXT'; }

            var auth,stat,type,resl;

            if (!func)
            {
               auth = Path.Auth(path);
               if (!auth || (auth == 'f')){ return VOID; }

               stat = Fsys.lstatSync(path);
               type = (stat.isDirectory() ? 'fold' : (stat.isFile() ? 'file' : null));

               return (!type ? null : ((type=='fold') ? Fsys.readdirSync(path) : Fsys.readFileSync(path,'utf8')));
            }

            Path.Auth(path,function(auth)
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
      }
   });
// --------------------------------------------------------------------------------------------------------





// glob :: Import
// --------------------------------------------------------------------------------------------------------
   Define
   ({
      Import:function(path)
      {
         var extn,self,modu;

         if (path.indexOf('/') < 0)
         {
            modu = path;
            // path = ('./node_modules/'+modu);
            try{ modu=require(modu); return modu; }catch(e){}
            // try{ modu=require(path); return modu; }catch(e){}

            return;
         }

         path = path.split('//').join('/');

         var type = Path.Type(path);
         var extn = path.split('.').pop();
         var self = this;
         var resl = {};
         var name;

         if (type == 'fold')
         {
            (Path.Read(path)).Each = function(item)
            {
               name = item.split('.')[0];
               resl[name] = Import(path+'/'+item);
            };

            return resl;
         }

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

         js:function(defn){ return require(defn); },
         njs:function(defn){ return require(defn); },
         json:function(defn){ return require(defn); },
         conf:function(defn){ return this['v'](defn); },
      })
   });
// --------------------------------------------------------------------------------------------------------
