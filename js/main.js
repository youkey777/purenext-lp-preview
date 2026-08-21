/* PureNext LP v2 — お客様の声カルーセル & FAQアコーディオン（素のJS・依存なし） */
(function () {
  "use strict";

  /* ---------- お客様の声カルーセル ---------- */
  var SLIDES = [
    {
      photo: "images/review_main.png",
      alt: "夜の寝室で赤ちゃんを抱きながら Pure Next から水を注ぐ女性",
      lines: [
        "40℃モードなら、熱湯も冷水も測らず2ポチ。",
        "夜中の調乳がホントに楽になりました。",
        "10ml単位で自由に変えられるのも<br>気が利きすぎてる。"
      ]
    },
    {
      photo: "images/review_slide2.png",
      alt: "朝のキッチンで白湯の入ったマグカップを持つ女性",
      lines: [
        "毎朝の白湯が習慣になりました。",
        "もう沸かさなくていいのが快適です。",
        "温度で迷わないのが、地味にうれしい。"
      ]
    },
    {
      photo: "images/review_slide3.png",
      alt: "明るいリビングでくつろぐ家族と Pure Next",
      lines: [
        "検討していた宅配水より、<br>自宅の使い方に合っていました。",
        "冷蔵庫の場所も空いて、<br>段ボールをたたむ手間もゼロに。"
      ]
    }
  ];

  var stage = document.getElementById("voiceStage");
  if (stage) {
    var photo = document.getElementById("voicePhoto");
    var quote = document.getElementById("voiceQuote");
    var sideL = document.getElementById("voiceSidePhotoL");
    var sideR = document.getElementById("voiceSidePhotoR");
    var sideQuoteL = document.querySelector(".voice__side--left .voice__side-quote");
    var sideQuoteR = document.querySelector(".voice__side--right .voice__side-quote");
    var idx = 0;
    var busy = false;

    function quoteHtml(lines, withOpen, withClose) {
      var h = "";
      if (withOpen) h += '<span class="voice__mark voice__mark--open">“</span>';
      for (var i = 0; i < lines.length; i++) h += "<p>" + lines[i] + "</p>";
      if (withClose) h += '<span class="voice__mark voice__mark--close">”</span>';
      return h;
    }

    function render() {
      var n = SLIDES.length;
      var cur = SLIDES[idx];
      var prev = SLIDES[(idx + n - 1) % n];
      var next = SLIDES[(idx + 1) % n];
      photo.src = cur.photo;
      photo.alt = cur.alt;
      quote.innerHTML = quoteHtml(cur.lines, true, true);
      sideL.src = prev.photo;
      sideR.src = next.photo;
      sideQuoteL.innerHTML = quoteHtml(prev.lines.slice(0, 2), false, true);
      sideQuoteR.innerHTML = quoteHtml(next.lines.slice(0, 2), true, false);
    }

    function go(step) {
      if (busy) return;
      busy = true;
      stage.classList.add("is-fading");
      window.setTimeout(function () {
        idx = (idx + step + SLIDES.length) % SLIDES.length;
        render();
        stage.classList.remove("is-fading");
        window.setTimeout(function () { busy = false; }, 260);
      }, 260);
    }

    document.getElementById("voicePrev").addEventListener("click", function () { go(-1); });
    document.getElementById("voiceNext").addEventListener("click", function () { go(1); });
    render();
  }

  /* ---------- FAQアコーディオン ---------- */
  var btns = document.querySelectorAll(".faq__qbtn");
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function () {
      var open = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", open ? "false" : "true");
      var panel = this.parentElement.querySelector(".faq__a");
      if (panel) panel.hidden = open;
    });
  }
})();
