function openModal(id) {
    var modal = $("#modal-" + id);
    modal.css("display", "block");
    modal.css("overflow", "hidden");
}

function closeModal(id) {
    console.log(event);
    let modal = $('#modal-' + id);
    if (event.target == modal[0]
        || event.target == $(`#modal-${id} .close-button`)[0]) {
        modal.removeAttr("style");
    }
}

function getScrollFraction(selector) {
    var s = $(selector).prop("scrollTop"),
        d = $(selector).prop("scrollHeight"),
        c = $(selector).prop("offsetHeight");

    var scrollFraction = s / (d - c);

    return scrollFraction;
}

function scrollToSection(selector) {
    $("#scroll-container")[0].scrollTo({
        top: $(selector).offset().top
            - $("#scroll-container").children().first().offset().top
            - 20,
        behavior: "smooth",
    });
}

$("#scroll-container").scroll(function () {
    $("#video-bg")[0].currentTime = $("#video-bg")[0].duration * getScrollFraction("#scroll-container") * 0.7;
});

$(function () {
    const m = "a2FtemVsYXNuQGdtYWlsLmNvbQ==";
    const aa = document.getElementsByClassName("mail");
    for (var i = 0; i < aa.length; i++) {
        aa[i].setAttribute("href", "mailto:" + atob(m));
    };
});