function initModal(className) {
	const showModal = document.createElement("DIV");
	showModal.classList.add("show-img-modal");

	const overlay = document.createElement("DIV");
	overlay.classList.add("img-modal-overlay");

	const imgShow = document.createElement("DIV");
	imgShow.classList.add("img-show");

	const mainImg = document.createElement("IMG");
	mainImg.setAttribute("src", ".");
	mainImg.id = "modal-img";


	const closeBtn = document.createElement("SPAN");
	closeBtn.classList.add("close-img-modal");
	const close = document.createTextNode("✕");
	closeBtn.appendChild(close);

	imgShow.appendChild(mainImg);
	imgShow.appendChild(closeBtn);

	showModal.appendChild(overlay);
	showModal.appendChild(imgShow);

	const modal = document.getElementsByClassName(className)[0];
	modal.prepend(showModal);

	modal.addEventListener("click", function (e) {
		const target = e.target;
		const targetClass = e.target.className;
		const targetId = target.id;

		if (targetClass == "img-modal-overlay" || targetClass == "close-img-modal" || targetClass == "img-show") {
			closeImgModal();
		} else if (targetId == "modal-img") {
			event.stopPropagation();
		}
	})
}

function addModal(els) {
	els.forEach(img => {
		img.addEventListener('click', function () {
			openImgModal(img.src);
		})
	})
}


function openImgModal(src) {
	document.querySelector(".show-img-modal").style.visibility = "visible";
	document.querySelector(".show-img-modal").style.opacity = "1";
	document.querySelector(".img-show #modal-img").src = src;
}

function closeImgModal() {
	document.querySelector(".show-img-modal").style.visibility = "hidden";
	document.querySelector(".show-img-modal").style.opacity = "0";
}
