const PHONE_WSP = "+56987829204";
function openWsp(message){ window.open(`https://wa.me/${PHONE_WSP}?text=${encodeURIComponent(message)}`,'_blank'); }