// this function adds the + and functionality to the toc so that it is less scary
// it's still pretty scary ngl it's a giant toc but at least it starts hidden
function initTocOnClick() {
	const colls = document.querySelectorAll(".ltx_tocentry.ltx_tocentry_section > .ltx_ref");

	for (const coll of colls) {
		coll.addEventListener("click", (event) => {
			const content = coll.nextElementSibling;
			if (content) {
				if (content.style.maxHeight) {
					event.preventDefault(); // don't jump if closing
					content.style.maxHeight = null;
				} else {
					content.style.maxHeight = content.scrollHeight + "px";
				}
			}
		});
		// don't add the + if there's nothing to expand
		if (!coll.nextElementSibling) {
			coll.classList.add("del");
		}
	}
}

// copy on click for section permalinks
function copyURI(event) {
	event.preventDefault();
	try {
		navigator.clipboard.writeText(
			// ensures url is without hash, then add on correct hash
			window.location.href.replace(window.location.hash, "") + event.target.getAttribute("href")
		);
	} catch (e) {
		console.error(e);
	}
	// toast that i ripped from w3schools. does not nicely handle being spam clicked. w/e
	// OKAY understanding more later. why is this replace and not remove? so ugly wow...
	// you're telling me that chatgpt and copilot were trained on obtuse garbage like this!?
	const snackbar = document.getElementById("snackbar");
	snackbar.className = "show";
	setTimeout(() => {
		snackbar.className = snackbar.className.replace("show", "");
	}, 2000);
}

// source: https://stackoverflow.com/questions/56300132/how-to-override-css-prefers-color-scheme-setting
// ty jimmy banks
// determines if the user has a set theme or a stored theme on load
function detectColorScheme() {
	// check if already saved dark
	if (localStorage.getItem("theme")) {
		if (localStorage.getItem("theme") === "dark") {
			document.documentElement.setAttribute("data-theme", "dark");
		}
	} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
		// set to dark if OS preferred
		document.documentElement.setAttribute("data-theme", "dark");
		localStorage.setItem("theme", "dark");
	} else {
		// default light otherwise
		document.documentElement.setAttribute("data-theme", "light");
		localStorage.setItem("theme", "light");
	}
}

function detectFont() {
	// check if user wants sans
	if (localStorage.getItem("font") === "sans") {
		document.documentElement.setAttribute("data-font", "sans");
		localStorage.setItem("font", "sans");
	}
	else {
		// otherwise give avec
		document.documentElement.setAttribute("data-font", "avec");
		localStorage.setItem("font", "avec");
	}
}

// source: https://www.accessibilityfirst.at/posts/dark-and-light-mode-a-simple-guide-for-web-design-and-development
// add onClick to toggle theme between light and dark
function initThemeToggle() {
	document.getElementById("theme-toggle").addEventListener("click", () => {
		document.documentElement.setAttribute(
			"data-theme",
			document.documentElement.getAttribute("data-theme") === "dark"
				? "light"
				: "dark"
		);
		localStorage.setItem(
			"theme",
			document.documentElement.getAttribute("data-theme")
		);
	});
}

// the same function except it's for font toggle
// btw i think i'm a little funny for the var naming
// funny status redacted for the var naming
function initFontToggle() {
	document.getElementById("font-toggle").addEventListener("click", () => {
		document.documentElement.setAttribute(
			"data-font",
			document.documentElement.getAttribute("data-font") === "avec"
				? "sans"
				: "avec"
		);
		localStorage.setItem(
			"font",
			document.documentElement.getAttribute("data-font")
		);
	});
}

// saving the scroll position for clicking references or toc
function saveScroll() {
	const colls = document.querySelectorAll(".ltx_ref");

	for (const coll of colls) {
		coll.addEventListener("click", function(event) {
			//only applies the "active" class to the ToC items (put here to prevent a race condition)
			if (this.parentElement.classList.contains("ltx_tocentry_section")) {
				const isActive = this.classList.toggle("active");
				if (!isActive) return;
			}
			
			const scrollPos = Math.floor(window.scrollY);
			const linkedElement = document.querySelector(this.getAttribute("href").replaceAll(".", "\\2E")); // \\2E is "."
			const linkedElementScrollPos = linkedElement ? scrollPos + Math.floor(linkedElement.getBoundingClientRect().y) : 0;
			const scrollArray = getScrollArray();
			if (
				(scrollPos === 0 && scrollArray.length > 0)
				|| (scrollPos > 0 && scrollArray[0] !== scrollPos)
				|| (scrollPos > 0 && linkedElementScrollPos !== scrollArray[0])
			) {
				scrollArray.unshift(scrollPos);
				updateScrollArray(scrollArray);
			}
			
			updateReturn(scrollArray);
		});
	}
}

function getScrollArray() {
	return JSON.parse(sessionStorage.getItem("scrollPos") ?? "[]").map(num => Number(num));
}

function updateScrollArray(scrollArray=[]) {
	sessionStorage.setItem("scrollPos", JSON.stringify(scrollArray));
}

function updateReturn(scrollArray) {
	if (typeof scrollArray === "object" && scrollArray.length > 0) {
		document.getElementById("return").classList.add("show"); // only fires once
	}
}

// it returns to scroll positions stored in the array "scrollPos"
function returnScroll() {
	document.getElementById("return").addEventListener("click", function(event) {

		const scrollArray = getScrollArray();
		// check if saved, otherwise goto top and remove back arrow
		if (scrollArray.length > 1) {
			let scrollPos = scrollArray.shift();
			while (scrollPos === Math.floor(window.scrollY) && scrollArray.length > 0) {
				scrollPos = scrollArray.shift();
			}
			sessionStorage.setItem("scrollPos", JSON.stringify(scrollArray));
			window.scroll(0, scrollPos);
		}
		else if (scrollArray.length === 1) {
			this.classList.remove("show");
			let scrollPos = scrollArray.shift();
			sessionStorage.setItem("scrollPos", JSON.stringify(scrollArray));
			// scroll to top
			window.scroll(0, scrollPos);
		} else {
			this.classList.remove("show");
			// scroll to top
			window.scroll(0, 0);
		}

	});
}

// run da functions
function main() {
	const funcs = [
		initTocOnClick,
		detectColorScheme,
		detectFont,
		initThemeToggle,
		initFontToggle,
		saveScroll,
		returnScroll
	];
	for (const func of funcs) {
		try {
			func();
		} catch (e) {
			console.error(e);
		}
	}
}

main();
