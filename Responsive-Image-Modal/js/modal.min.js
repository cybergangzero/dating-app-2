function initModal(e){const t=document.createElement("DIV");t.classList.add("show-img-modal");const o=document.createElement("DIV");o.classList.add("img-modal-overlay");
const d=document.createElement("DIV");d.classList.add("img-show");const c=document.createElement("IMG");c.setAttribute("src","."),c.id="modal-img";
const l=document.createElement("SPAN");l.classList.add("close-img-modal");const n=document.createTextNode("✕");l.appendChild(n),d.appendChild(c),d.appendChild(l),
t.appendChild(o),t.appendChild(d);const a=document.getElementsByClassName(e)[0];a.prepend(t),a.addEventListener("click",function(e){const t=e.target,o=e.target.className,
d=t.id;"img-modal-overlay"==o||"close-img-modal"==o||"img-show"==o?closeImgModal():"modal-img"==d&&event.stopPropagation()})}function addModal(e)
{e.forEach(e=>{e.addEventListener("click",function(){openImgModal(e.src)})})}function openImgModal(e){document.querySelector(".show-img-modal").style.visibility="visible",
  document.querySelector(".show-img-modal").style.opacity="1",document.querySelector(".img-show #modal-img").src=e}function closeImgModal()
{document.querySelector(".show-img-modal").style.visibility="hidden",document.querySelector(".show-img-modal").style.opacity="0"}
