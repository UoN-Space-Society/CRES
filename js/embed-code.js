(function () {
  window.Juicer = window.Juicer || {};
  window.Juicer.Constants = window.Juicer.Constants || {};
    window.Juicer.Constants.API_ROOT = "//www.juicer.io";
      if (navigator.userAgent.match(/MSIE 9/) || navigator.userAgent.match(/MSIE 8/) || window.location.protocol === 'file:') {
        Juicer.Constants.API_ROOT = 'https:' + Juicer.Constants.API_ROOT;
      }

  var juicerCurrentScript = document.currentScript;

  window.runJuicerAfterCallback = function(event, callbackCode) {
  }

    var juicerCssUrl = "//www.juicer.io/embed_juicer20-5108e953505520cd3dd02b1f197b58303275545a9ece0dc0b8a84c43fc1375a2.css";
var juicerJsUrl = "//www.juicer.io/embed_juicer20-e75decfc6bccd842b34ea0a8e76616500341e5a98c3fa82d44367bd41731bff0.js";

function setAttributesToJuicerElement(juicerFeed) {
  // Always stamp the canonical slug, even over a customer-authored value:
  // the container is discovered case-insensitively ([data-feed-id="…" i]),
  // but juicerEvents.dispatch looks feeds up by exact dataset.feedId — a
  // casing mismatch would silently drop every lifecycle event (and with it
  // the page-view POST).
  juicerFeed.setAttribute('data-feed-id', 'projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122');
  if (!juicerFeed.hasAttribute('data-origin')) {
    juicerFeed.setAttribute('data-origin', 'embed-code');
  }
  // JuicerFeedComponents.loadFeed (the embed bundle) fetches this URL into
  // the container and sends the embed identification headers
  // (X-Juicer-Embed / X-Juicer-Referrer) with it — see feedRequest in
  // juicer_feed_components.js. The v= digest busts edge caches on deploy.
  if (!juicerFeed.hasAttribute('data-jcr-feed-url')) {
    juicerFeed.setAttribute('data-jcr-feed-url', 'https://www.juicer.io/api/feeds/projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122.html?origin=embed-code&v=e6913bcdcf6638f8ff7561d21d7ffdba0a20b914');
  }
}

// The asset filenames carry a content digest that changes on deploy, so on
// long-lived pages (SPAs re-initializing the embed) an older version of the
// same file may already be in the DOM under a different URL.
function staleAssetVersions(url, selector) {
  var logicalName = url.split('/').pop().split('-')[0];
  return Array.from(document.querySelectorAll(selector)).filter(function(el) {
    var src = el.getAttribute('href') || el.getAttribute('src') || '';
    return src !== url && src.split('/').pop().split('-')[0] === logicalName;
  });
}

function loadStylesheet(href) {
  return new Promise(function(resolve, reject) {
    if (document.querySelector('link[href="' + href + '"]')) {
      resolve();
      return;
    }
    var staleLinks = staleAssetVersions(href, 'link[rel="stylesheet"]');
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.media = 'all';
    link.href = href;
    link.onload = function() {
      // Removed only after the replacement is live so the feed never renders unstyled.
      staleLinks.forEach(function(stale) { stale.remove(); });
      resolve();
    };
    link.onerror = function() { reject(new Error('Failed to load: ' + href)); };
    document.head.appendChild(link);
  });
}

function loadEmbedScript() {
  // When a current Juicer component runtime is already loaded (e.g. Juicer
  // Pages, which use the Juicer 2.0 dashboard stack), skip loading the embed
  // bundle — the page's own copy loads the feed. The loadFeed capability
  // check doubles as a version guard: a stale runtime without it (cached
  // pre-D-984 bundle) falls through to loading the current embed bundle. A
  // host page that merely runs its own frameworks never matches: the embed
  // markup carries no framework directives, so a second framework instance
  // on the page can't clash with it (D-954).
  if (window.JuicerFeedComponents && window.JuicerFeedComponents.loadFeed) {
    document.querySelectorAll('.juicer-feed').forEach(function(feed) {
      if (!feed.parentElement || !feed.parentElement.closest('.juicer-feed')) {
        window.JuicerFeedComponents.loadFeed(feed);
      }
    });
    return;
  }

  var existingScript = document.querySelector('script[src="' + juicerJsUrl + '"]');
  if (existingScript) {
    existingScript.remove();
  }
  staleAssetVersions(juicerJsUrl, 'script[src]').forEach(function(stale) { stale.remove(); });
  var script = document.createElement('script');
  script.async = true;
  script.src = juicerJsUrl;
  document.head.appendChild(script);
}

window.Juicer.initialize = function() {
  var cssUrls = [juicerCssUrl];

  Promise.all(cssUrls.map(loadStylesheet))
    .then(function() {
      var feedElements = document.querySelectorAll('.juicer-feed[data-feed-id="projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122" i]');
      if (feedElements.length === 0) {
        return;
      }
      var el = feedElements[0];
      setAttributesToJuicerElement(el);

      loadEmbedScript();
    })
    .catch(function(error) {
      console.error('Juicer: Failed to load assets', error);
    });
};

window.Juicer.remove = function() {
  var feedElements = document.querySelectorAll('.juicer-feed[data-feed-id="projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122" i]');
  if (feedElements.length > 0) {
    var el = feedElements[0];
    // Destroy component instances (masonry/ad/autoscroll observers, intervals,
    // window listeners) before discarding their DOM.
    if (window.JuicerFeedComponents) {
      window.JuicerFeedComponents.unmount(el);
    }
    el.innerHTML = '';
    // Re-arm loadFeed's idempotency marker so a later Juicer.initialize()
    // (SPA navigation back to the page) fetches the feed again.
    el.removeAttribute('data-jcr-loaded');
  }
  // Cancel the in-flight sendFeedDimensions polling chain (it would otherwise keep
  // posting stale dimensions for up to 30s) and drop the feed's metadata so the
  // fetch engine stops dispatching events for this slug.
  var slug = "projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122";
  var meta = window.juicerEvents && window.juicerEvents.feeds[slug];
  if (meta) {
    if (meta.dimensionsTimer) clearTimeout(meta.dimensionsTimer);
    delete window.juicerEvents.feeds[slug];
  }
};

var juicerLoadingIndicator = '<div style="display:flex;align-items:center;justify-content:center;padding:48px 0"><style>@keyframes juicer-spin{to{transform:rotate(360deg)}}</style><div style="width:32px;height:32px;border:3px solid #E4E7EB;border-top-color:#F05B4A;border-radius:50%;animation:juicer-spin .8s linear infinite"></div></div>';

// Each script claims the first unclaimed .juicer-feed[data-feed-id=slug] in
// DOM order. Synchronous <script src> tags execute in DOM order, so this
// pairs script_N with div_N for the WP multi-segment case while still finding
// a div placed elsewhere on the page (script in <head>/footer, async loaders).
const candidates = document.querySelectorAll('.juicer-feed[data-feed-id="projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122" i]');
let ownedFeedElement = Array.from(candidates).find(el => !el.hasAttribute('data-juicer-claimed'));
if (!ownedFeedElement) {
  ownedFeedElement = document.createElement('div');
  ownedFeedElement.setAttribute('class', 'juicer-feed');
  if (juicerCurrentScript && juicerCurrentScript.parentNode) {
    juicerCurrentScript.parentNode.insertBefore(ownedFeedElement, juicerCurrentScript);
  } else {
    document.body.appendChild(ownedFeedElement);
  }
}

ownedFeedElement.setAttribute('data-juicer-claimed', 'true');
setAttributesToJuicerElement(ownedFeedElement);
if (ownedFeedElement.innerHTML.trim() === '') {
  ownedFeedElement.innerHTML = juicerLoadingIndicator;
}

window.Juicer.initialize();

// Lifecycle event dispatcher (juicer:feedLoaded / feedPaginated / overlayRendered DOM events
// and juicer:feedSize postMessage). Per-feed metadata is registered under
// window.juicerEvents.feeds[<slug>]; the global helper is installed once and shared by all
// feeds rendered on the same page. The fetch engine in juicer_feed_components.js
// calls dispatch/sendFeedDimensions directly when a swap completes.
if (!window.juicerEvents) {
  window.juicerEvents = {
    feeds: {},
    dispatch: function(eventName, feedEl) {
      var slug = feedEl && feedEl.dataset && feedEl.dataset.feedId;
      var meta = slug && window.juicerEvents.feeds[slug];
      if (!meta) return;
      document.dispatchEvent(new CustomEvent('juicer:' + eventName, {
        detail: { feed: { id: meta.id, name: meta.name, slug: meta.slug } }
      }));
    },
    sendFeedDimensions: function(slug, iterationsRemaining) {
      var meta = window.juicerEvents.feeds[slug];
      if (!meta) return;
      if (iterationsRemaining === undefined) {
        if (meta.dimensionsTimer) clearTimeout(meta.dimensionsTimer);
        iterationsRemaining = 75;
      }
      window.parent.postMessage({
        type: 'juicer:feedSize',
        dimensions: { width: document.body.scrollWidth, height: document.body.scrollHeight },
        feed: { id: meta.id, name: meta.name, slug: meta.slug }
      }, '*');
      // First 5s every 200ms (25 iters), then 25s every 500ms (50 iters); 30s total.
      if (iterationsRemaining > 50) {
        meta.dimensionsTimer = setTimeout(function() {
          window.juicerEvents.sendFeedDimensions(slug, iterationsRemaining - 1);
        }, 200);
      } else if (iterationsRemaining >= 1) {
        meta.dimensionsTimer = setTimeout(function() {
          window.juicerEvents.sendFeedDimensions(slug, iterationsRemaining - 1);
        }, 500);
      } else {
        meta.dimensionsTimer = null;
      }
    }
  };
}
window.juicerEvents.feeds["projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122"] = {
  id: 457002,
  name: "projecthelia",
  slug: "projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122"
};

// Track page view once when the feed first loads (not on polls, filters, or
// pagination — the listener detaches on the first juicer:feedLoaded for this
// feed's slug, and the initial load is always the first one dispatched).
// This script only runs in embed context (not on the dashboard).
(function() {
  var crawlers = ["200pleasebot","360spider","abot","addthis","adldxbot","admantx","adsbot-google","adstxtcrawler","advbot","ahrefsbot","alexa","anderspink","apache-httpclient","apachebench","apis-google","appengine-google","applebot","appsignal","archive.org_bot","archiveteam archivebot","ask jeeves","asynchttpclient","awe.sm","baidu","barkrowler","bdcbot","bingbot","bingpreview","bitlybot","blekkobot","blexbot","bot@linkfluence.net","bubing","bufferbot","buibui-checkbot","butterfly","buzzbot","buzztalk","catchbot","check_http","checkly","chrome-lighthouse","cipacrawler","cliqzbot","cloudflare","cmradar/0.1","coldfusion","commoncrawl","comodo ssl checker","comodo-webinspector-crawler","copypants","crowsnest","curabot","curl","dap/nethttp","datafeedwatch","datagnionbot","datanyze","daumoa","developers.google.com/+/web/snippet/","diffbot","digitalpersona fingerprint software","domain re-animator bot","domainsbot","domaintunocrawler","dotbot","duckduckbot","elb-healthchecker","embedly","eoaagent","everyonesocialbot","evrinid","exabot","exaleadcloudview","ez publish","facebookexternalhit","facebot","feedburner","feedfetcher-google","findxbot","flipboardproxy","friendfeedbot","fyrebot","garlik","genieo","germcrawler","getprismatic.com","gigabot","gimme60bot","gimmeusabot","go http package","go-http-client","google page speed insights","google web preview","google-site-verification","google-structured-data-testing-tool","google-structureddatatestingtool","google-xrawler","googlebot","googleimageproxy","googlestackdrivermonitoring-uptimechecks","grapeshotcrawler","gravitybot","hatena::bookmark","heritrix","https://developers.google.com/+/web/snippet","httrack","hubspot","ia_archiver","icoreservice","idmarch","implisensebot","inagist","insieve","insitesbot","instapaper","istellabot","jaunt","jetslide","jobseeker","jooble","js-kit","kemvibot","kimengi","knows.is","kojitsubot","komodiabot","kraken","laconica","lijit crawler","linkdexbot","linkedinbot","linkscrawler","linode","lipperhey","livelapbot","loadtimebot","longurl","ltx71","lumibot","magpie-crawler","mail.ru_bot","mappydata","mastodon","mauibot","meanpathbot","mediapartners-google","megaindex.ru","memorybot","metauri","mfe_expand","mir web crawler","mj12bot","mojeekbot","ms search 6.0 robot","msnbot-media","msnbot","nerdybot","netcraft","netstate","netvibes","netzcheckbot","newrelicmonitor","newrelicpinger","newsme","niki-bot","ning","nutch","openhosebot","orangebot","paessler","pagesinventory","panopta","paperlibot","peerindex","percolatecrawler","perfectmarketkwtbot","phantomjs","pingdom","pinterest","plukkie","pr-cy.ru","privacyawarebot","proximic","psbot-page","pu_in","publiclibraryarchive.org","pycurl","python-httplib2","python-requests","python-urllib","queryseeker","quick-crawler","quicklook","re-animator","readability","rebelmouse","redditbot","relateiq","riddler","rogerbot","rssmicro","scouturlmonitor","scrapy","screaming frog seo spider","searchmetricsbot","semanticbot","semrushbot","seo-audit","seobilitybot","seodiver","seokicks","seznambot","shopwiki","shortlinktranslate","showyoubot","siege","sistrix","sitecheck","siteuptime","skypeuripreview","slack-imgproxy","slack-linkexpanding","slack","slackbot","slurp","smtbot","snapchat","socialrank","sogou","spbot","spinn3r","sputnikbot","squider","statuscake","swiftbot","tangibleebot","teeraid","test certificate info","the knowledge ai","tineye","traackr","trendictionbot","trendsmap","turnitinbot","tweetedtimes","tweetmemebot","twikle","twitjobsearch","twitmunin","twitterbot","twurly","typhoeus","umbot","unwindfetch","updown","uptimerobot","vagabondo","vb project","vigil","vkshare","voilabot","vrcrawler","wasalive-bot","watchsumo","wbsearchbot","webceo","webscout","wesee","wget","whatsapp","wikido","woorank","wordpress","woriobot","wormly","wotbox","xenu link sleuth","xing-contenttabreceiver","xovibot","yacybot","yahoo-ad-monitoring","yandex","yanga","yeti","yourls","zabbix","zelist.ro","zibb","zitebot","zoombot","zoominfobot","zyborg","amazonbot","anthropic-ai","bytespider","ccbot","chatgpt-user","claude-web","cohere-ai","facebookbot","google-extended","googleother","gptbot","omgili","perplexitybot","webz.io","youbot","httpie","eventmachine httpclient","go 1.1 package http","htmlparser","http_request2","httpclient","jakarta commons","java","libwww-perl","lwp-trivial","ruby"];
  var lowerUA = navigator.userAgent.toLowerCase();
  if (crawlers.some(function(c) { return lowerUA.indexOf(c) !== -1; })) return;

  function onFeedLoaded(event) {
    var feed = event.detail && event.detail.feed;
    if (!feed || feed.slug !== "projecthelia-20140f1f-fc8f-438b-87e2-e0d8f12c5122") return;

    document.removeEventListener('juicer:feedLoaded', onFeedLoaded);
    fetch(Juicer.Constants.API_ROOT + '/api/page_views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feed_id: '457002' }),
      credentials: 'omit'
    }).catch(function() {});
  }

  document.addEventListener('juicer:feedLoaded', onFeedLoaded);
})();

})();
