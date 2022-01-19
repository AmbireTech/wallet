javascript:(function() {
	if(window.bmlInjected) return console.log("ambire bookmarklet already injected on this page");
	let s= document.createElement('script');
	s.type= 'text/javascript';
	s.src= "{AMBIRE_URL}/bookmarklet/webpackedBookmarkletInjection.js";
	void(document.body.appendChild(s));
})();
