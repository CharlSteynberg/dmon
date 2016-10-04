document.Listen('DOMContentLoaded',function()
{
   if (!window.ViewData || !ViewData.FoldList){ return; }

   var html = '';

   ViewData.FoldList.Each = function(item)
   {
      html+= '<table class="mrgn-01 link" style="width:50%" onclick="Goto(\''+item.Path+'\')"><tr>';
      html+= '<td class="size-02" style="width:2rem"><i class="icon-'+item.Icon+'"></i></td>';
      html+= '<td class="size-01" style="width:auto">'+item.Path+'</td>';
      html+= '<td class="text-rigt" style="width:10rem; font-size:1rem; opacity:0.6"><pre>'+item.Size+'</pre></td>';
      html+= '</tr></table>';
   };

   document.body.innerHTML = html;
});
