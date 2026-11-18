function rr(a) {
  if (a === void 0)
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return a;
}
function Jo(a, e) {
  a.prototype = Object.create(e.prototype), a.prototype.constructor = a, a.__proto__ = e;
}
var Tt = {
  autoSleep: 120,
  force3D: "auto",
  nullTargetWarn: 1,
  units: {
    lineHeight: ""
  }
}, Zi = {
  duration: 0.5,
  overwrite: !1,
  delay: 0
}, Ys, Ie, ae, Dt = 1e8, te = 1 / Dt, ys = Math.PI * 2, wu = ys / 4, Tu = 0, ea = Math.sqrt, Su = Math.cos, ku = Math.sin, Re = function(e) {
  return typeof e == "string";
}, ge = function(e) {
  return typeof e == "function";
}, ur = function(e) {
  return typeof e == "number";
}, Xs = function(e) {
  return typeof e > "u";
}, Qt = function(e) {
  return typeof e == "object";
}, ut = function(e) {
  return e !== !1;
}, qs = function() {
  return typeof window < "u";
}, gn = function(e) {
  return ge(e) || Re(e);
}, ta = typeof ArrayBuffer == "function" && ArrayBuffer.isView || function() {
}, He = Array.isArray, Cu = /random\([^)]+\)/g, Pu = /,\s*/g, go = /(?:-?\.?\d|\.)+/gi, ra = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g, fi = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g, ns = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi, ia = /[+-]=-?[.\d]+/, Ou = /[^,'"\[\]\s]+/gi, Mu = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i, fe, Ut, vs, Vs, St = {}, Yn = {}, na, sa = function(e) {
  return (Yn = xi(e, St)) && ht;
}, Us = function(e, r) {
  return console.warn("Invalid property", e, "set to", r, "Missing plugin? gsap.registerPlugin()");
}, ji = function(e, r) {
  return !r && console.warn(e);
}, oa = function(e, r) {
  return e && (St[e] = r) && Yn && (Yn[e] = r) || St;
}, Ji = function() {
  return 0;
}, Du = {
  suppressEvents: !0,
  isStart: !0,
  kill: !1
}, Dn = {
  suppressEvents: !0,
  kill: !1
}, Eu = {
  suppressEvents: !0
}, Ws = {}, Tr = [], xs = {}, aa, yt = {}, ss = {}, mo = 30, En = [], $s = "", Gs = function(e) {
  var r = e[0], t, i;
  if (Qt(r) || ge(r) || (e = [e]), !(t = (r._gsap || {}).harness)) {
    for (i = En.length; i-- && !En[i].targetTest(r); )
      ;
    t = En[i];
  }
  for (i = e.length; i--; )
    e[i] && (e[i]._gsap || (e[i]._gsap = new Ma(e[i], t))) || e.splice(i, 1);
  return e;
}, Ur = function(e) {
  return e._gsap || Gs(Et(e))[0]._gsap;
}, ua = function(e, r, t) {
  return (t = e[r]) && ge(t) ? e[r]() : Xs(t) && e.getAttribute && e.getAttribute(r) || t;
}, lt = function(e, r) {
  return (e = e.split(",")).forEach(r) || e;
}, xe = function(e) {
  return Math.round(e * 1e5) / 1e5 || 0;
}, le = function(e) {
  return Math.round(e * 1e7) / 1e7 || 0;
}, _i = function(e, r) {
  var t = r.charAt(0), i = parseFloat(r.substr(2));
  return e = parseFloat(e), t === "+" ? e + i : t === "-" ? e - i : t === "*" ? e * i : e / i;
}, Ru = function(e, r) {
  for (var t = r.length, i = 0; e.indexOf(r[i]) < 0 && ++i < t; )
    ;
  return i < t;
}, Xn = function() {
  var e = Tr.length, r = Tr.slice(0), t, i;
  for (xs = {}, Tr.length = 0, t = 0; t < e; t++)
    i = r[t], i && i._lazy && (i.render(i._lazy[0], i._lazy[1], !0)._lazy = 0);
}, Hs = function(e) {
  return !!(e._initted || e._startAt || e.add);
}, la = function(e, r, t, i) {
  Tr.length && !Ie && Xn(), e.render(r, t, !!(Ie && r < 0 && Hs(e))), Tr.length && !Ie && Xn();
}, fa = function(e) {
  var r = parseFloat(e);
  return (r || r === 0) && (e + "").match(Ou).length < 2 ? r : Re(e) ? e.trim() : e;
}, ca = function(e) {
  return e;
}, kt = function(e, r) {
  for (var t in r)
    t in e || (e[t] = r[t]);
  return e;
}, Au = function(e) {
  return function(r, t) {
    for (var i in t)
      i in r || i === "duration" && e || i === "ease" || (r[i] = t[i]);
  };
}, xi = function(e, r) {
  for (var t in r)
    e[t] = r[t];
  return e;
}, yo = function a(e, r) {
  for (var t in r)
    t !== "__proto__" && t !== "constructor" && t !== "prototype" && (e[t] = Qt(r[t]) ? a(e[t] || (e[t] = {}), r[t]) : r[t]);
  return e;
}, qn = function(e, r) {
  var t = {}, i;
  for (i in e)
    i in r || (t[i] = e[i]);
  return t;
}, Yi = function(e) {
  var r = e.parent || fe, t = e.keyframes ? Au(He(e.keyframes)) : kt;
  if (ut(e.inherit))
    for (; r; )
      t(e, r.vars.defaults), r = r.parent || r._dp;
  return e;
}, zu = function(e, r) {
  for (var t = e.length, i = t === r.length; i && t-- && e[t] === r[t]; )
    ;
  return t < 0;
}, ha = function(e, r, t, i, n) {
  var s = e[i], o;
  if (n)
    for (o = r[n]; s && s[n] > o; )
      s = s._prev;
  return s ? (r._next = s._next, s._next = r) : (r._next = e[t], e[t] = r), r._next ? r._next._prev = r : e[i] = r, r._prev = s, r.parent = r._dp = e, r;
}, Jn = function(e, r, t, i) {
  t === void 0 && (t = "_first"), i === void 0 && (i = "_last");
  var n = r._prev, s = r._next;
  n ? n._next = s : e[t] === r && (e[t] = s), s ? s._prev = n : e[i] === r && (e[i] = n), r._next = r._prev = r.parent = null;
}, Pr = function(e, r) {
  e.parent && (!r || e.parent.autoRemoveChildren) && e.parent.remove && e.parent.remove(e), e._act = 0;
}, Wr = function(e, r) {
  if (e && (!r || r._end > e._dur || r._start < 0))
    for (var t = e; t; )
      t._dirty = 1, t = t.parent;
  return e;
}, Fu = function(e) {
  for (var r = e.parent; r && r.parent; )
    r._dirty = 1, r.totalDuration(), r = r.parent;
  return e;
}, bs = function(e, r, t, i) {
  return e._startAt && (Ie ? e._startAt.revert(Dn) : e.vars.immediateRender && !e.vars.autoRevert || e._startAt.render(r, !0, i));
}, Lu = function a(e) {
  return !e || e._ts && a(e.parent);
}, vo = function(e) {
  return e._repeat ? bi(e._tTime, e = e.duration() + e._rDelay) * e : 0;
}, bi = function(e, r) {
  var t = Math.floor(e = le(e / r));
  return e && t === e ? t - 1 : t;
}, Vn = function(e, r) {
  return (e - r._start) * r._ts + (r._ts >= 0 ? 0 : r._dirty ? r.totalDuration() : r._tDur);
}, es = function(e) {
  return e._end = le(e._start + (e._tDur / Math.abs(e._ts || e._rts || te) || 0));
}, ts = function(e, r) {
  var t = e._dp;
  return t && t.smoothChildTiming && e._ts && (e._start = le(t._time - (e._ts > 0 ? r / e._ts : ((e._dirty ? e.totalDuration() : e._tDur) - r) / -e._ts)), es(e), t._dirty || Wr(t, e)), e;
}, _a = function(e, r) {
  var t;
  if ((r._time || !r._dur && r._initted || r._start < e._time && (r._dur || !r.add)) && (t = Vn(e.rawTime(), r), (!r._dur || fn(0, r.totalDuration(), t) - r._tTime > te) && r.render(t, !0)), Wr(e, r)._dp && e._initted && e._time >= e._dur && e._ts) {
    if (e._dur < e.duration())
      for (t = e; t._dp; )
        t.rawTime() >= 0 && t.totalTime(t._tTime), t = t._dp;
    e._zTime = -te;
  }
}, $t = function(e, r, t, i) {
  return r.parent && Pr(r), r._start = le((ur(t) ? t : !t && Un(r) && (!e._last || e._last._start >= e._time) ? e._last ? e._last._start : e._time : t || e !== fe ? Pt(e, t, r) : e._time) + r._delay), r._end = le(r._start + (r.totalDuration() / Math.abs(r.timeScale()) || 0)), ha(e, r, "_first", "_last", e._sort ? "_start" : 0), Un(r) || (e._recent = r), i || _a(e, r), e._ts < 0 && ts(e, e._tTime), e;
}, da = function(e, r) {
  return (St.ScrollTrigger || Us("scrollTrigger", r)) && St.ScrollTrigger.create(r, e);
}, pa = function(e, r, t, i, n) {
  if (Qs(e, r, n), !e._initted)
    return 1;
  if (!t && e._pt && !Ie && (e._dur && e.vars.lazy !== !1 || !e._dur && e.vars.lazy) && aa !== xt.frame)
    return Tr.push(e), e._lazy = [n, i], 1;
}, Iu = function a(e) {
  var r = e.parent;
  return r && r._ts && r._initted && !r._lock && (r.rawTime() < 0 || a(r));
}, Un = function(e) {
  var r = e.data;
  return r === "isFromStart" || r === "isStart";
}, Bu = function(e, r, t, i) {
  var n = e.ratio, s = r < 0 || !r && (!e._start && Iu(e) && !(!e._initted && Un(e)) || (e._ts < 0 || e._dp._ts < 0) && !Un(e)) ? 0 : 1, o = e._rDelay, u = 0, l, f, _;
  if (o && e._repeat && (u = fn(0, e._tDur, r), f = bi(u, o), e._yoyo && f & 1 && (s = 1 - s), f !== bi(e._tTime, o) && (n = 1 - s, e.vars.repeatRefresh && e._initted && e.invalidate())), s !== n || Ie || i || e._zTime === te || !r && e._zTime) {
    if (!e._initted && pa(e, r, i, t, u))
      return;
    for (_ = e._zTime, e._zTime = r || (t ? te : 0), t || (t = r && !_), e.ratio = s, e._from && (s = 1 - s), e._time = 0, e._tTime = u, l = e._pt; l; )
      l.r(s, l.d), l = l._next;
    r < 0 && bs(e, r, t, !0), e._onUpdate && !t && bt(e, "onUpdate"), u && e._repeat && !t && e.parent && bt(e, "onRepeat"), (r >= e._tDur || r < 0) && e.ratio === s && (s && Pr(e, 1), !t && !Ie && (bt(e, s ? "onComplete" : "onReverseComplete", !0), e._prom && e._prom()));
  } else e._zTime || (e._zTime = r);
}, Nu = function(e, r, t) {
  var i;
  if (t > r)
    for (i = e._first; i && i._start <= t; ) {
      if (i.data === "isPause" && i._start > r)
        return i;
      i = i._next;
    }
  else
    for (i = e._last; i && i._start >= t; ) {
      if (i.data === "isPause" && i._start < r)
        return i;
      i = i._prev;
    }
}, wi = function(e, r, t, i) {
  var n = e._repeat, s = le(r) || 0, o = e._tTime / e._tDur;
  return o && !i && (e._time *= s / e._dur), e._dur = s, e._tDur = n ? n < 0 ? 1e10 : le(s * (n + 1) + e._rDelay * n) : s, o > 0 && !i && ts(e, e._tTime = e._tDur * o), e.parent && es(e), t || Wr(e.parent, e), e;
}, xo = function(e) {
  return e instanceof ot ? Wr(e) : wi(e, e._dur);
}, Yu = {
  _start: 0,
  endTime: Ji,
  totalDuration: Ji
}, Pt = function a(e, r, t) {
  var i = e.labels, n = e._recent || Yu, s = e.duration() >= Dt ? n.endTime(!1) : e._dur, o, u, l;
  return Re(r) && (isNaN(r) || r in i) ? (u = r.charAt(0), l = r.substr(-1) === "%", o = r.indexOf("="), u === "<" || u === ">" ? (o >= 0 && (r = r.replace(/=/, "")), (u === "<" ? n._start : n.endTime(n._repeat >= 0)) + (parseFloat(r.substr(1)) || 0) * (l ? (o < 0 ? n : t).totalDuration() / 100 : 1)) : o < 0 ? (r in i || (i[r] = s), i[r]) : (u = parseFloat(r.charAt(o - 1) + r.substr(o + 1)), l && t && (u = u / 100 * (He(t) ? t[0] : t).totalDuration()), o > 1 ? a(e, r.substr(0, o - 1), t) + u : s + u)) : r == null ? s : +r;
}, Xi = function(e, r, t) {
  var i = ur(r[1]), n = (i ? 2 : 1) + (e < 2 ? 0 : 1), s = r[n], o, u;
  if (i && (s.duration = r[1]), s.parent = t, e) {
    for (o = s, u = t; u && !("immediateRender" in o); )
      o = u.vars.defaults || {}, u = ut(u.vars.inherit) && u.parent;
    s.immediateRender = ut(o.immediateRender), e < 2 ? s.runBackwards = 1 : s.startAt = r[n - 1];
  }
  return new Se(r[0], s, r[n + 1]);
}, Er = function(e, r) {
  return e || e === 0 ? r(e) : r;
}, fn = function(e, r, t) {
  return t < e ? e : t > r ? r : t;
}, $e = function(e, r) {
  return !Re(e) || !(r = Mu.exec(e)) ? "" : r[1];
}, Xu = function(e, r, t) {
  return Er(t, function(i) {
    return fn(e, r, i);
  });
}, ws = [].slice, ga = function(e, r) {
  return e && Qt(e) && "length" in e && (!r && !e.length || e.length - 1 in e && Qt(e[0])) && !e.nodeType && e !== Ut;
}, qu = function(e, r, t) {
  return t === void 0 && (t = []), e.forEach(function(i) {
    var n;
    return Re(i) && !r || ga(i, 1) ? (n = t).push.apply(n, Et(i)) : t.push(i);
  }) || t;
}, Et = function(e, r, t) {
  return ae && !r && ae.selector ? ae.selector(e) : Re(e) && !t && (vs || !Ti()) ? ws.call((r || Vs).querySelectorAll(e), 0) : He(e) ? qu(e, t) : ga(e) ? ws.call(e, 0) : e ? [e] : [];
}, Ts = function(e) {
  return e = Et(e)[0] || ji("Invalid scope") || {}, function(r) {
    var t = e.current || e.nativeElement || e;
    return Et(r, t.querySelectorAll ? t : t === e ? ji("Invalid scope") || Vs.createElement("div") : e);
  };
}, ma = function(e) {
  return e.sort(function() {
    return 0.5 - Math.random();
  });
}, ya = function(e) {
  if (ge(e))
    return e;
  var r = Qt(e) ? e : {
    each: e
  }, t = $r(r.ease), i = r.from || 0, n = parseFloat(r.base) || 0, s = {}, o = i > 0 && i < 1, u = isNaN(i) || o, l = r.axis, f = i, _ = i;
  return Re(i) ? f = _ = {
    center: 0.5,
    edges: 0.5,
    end: 1
  }[i] || 0 : !o && u && (f = i[0], _ = i[1]), function(d, c, p) {
    var h = (p || r).length, m = s[h], w, b, S, x, T, O, v, P, C;
    if (!m) {
      if (C = r.grid === "auto" ? 0 : (r.grid || [1, Dt])[1], !C) {
        for (v = -Dt; v < (v = p[C++].getBoundingClientRect().left) && C < h; )
          ;
        C < h && C--;
      }
      for (m = s[h] = [], w = u ? Math.min(C, h) * f - 0.5 : i % C, b = C === Dt ? 0 : u ? h * _ / C - 0.5 : i / C | 0, v = 0, P = Dt, O = 0; O < h; O++)
        S = O % C - w, x = b - (O / C | 0), m[O] = T = l ? Math.abs(l === "y" ? x : S) : ea(S * S + x * x), T > v && (v = T), T < P && (P = T);
      i === "random" && ma(m), m.max = v - P, m.min = P, m.v = h = (parseFloat(r.amount) || parseFloat(r.each) * (C > h ? h - 1 : l ? l === "y" ? h / C : C : Math.max(C, h / C)) || 0) * (i === "edges" ? -1 : 1), m.b = h < 0 ? n - h : n, m.u = $e(r.amount || r.each) || 0, t = t && h < 0 ? tl(t) : t;
    }
    return h = (m[d] - m.min) / m.max || 0, le(m.b + (t ? t(h) : h) * m.v) + m.u;
  };
}, Ss = function(e) {
  var r = Math.pow(10, ((e + "").split(".")[1] || "").length);
  return function(t) {
    var i = le(Math.round(parseFloat(t) / e) * e * r);
    return (i - i % 1) / r + (ur(t) ? 0 : $e(t));
  };
}, va = function(e, r) {
  var t = He(e), i, n;
  return !t && Qt(e) && (i = t = e.radius || Dt, e.values ? (e = Et(e.values), (n = !ur(e[0])) && (i *= i)) : e = Ss(e.increment)), Er(r, t ? ge(e) ? function(s) {
    return n = e(s), Math.abs(n - s) <= i ? n : s;
  } : function(s) {
    for (var o = parseFloat(n ? s.x : s), u = parseFloat(n ? s.y : 0), l = Dt, f = 0, _ = e.length, d, c; _--; )
      n ? (d = e[_].x - o, c = e[_].y - u, d = d * d + c * c) : d = Math.abs(e[_] - o), d < l && (l = d, f = _);
    return f = !i || l <= i ? e[f] : s, n || f === s || ur(s) ? f : f + $e(s);
  } : Ss(e));
}, xa = function(e, r, t, i) {
  return Er(He(e) ? !r : t === !0 ? !!(t = 0) : !i, function() {
    return He(e) ? e[~~(Math.random() * e.length)] : (t = t || 1e-5) && (i = t < 1 ? Math.pow(10, (t + "").length - 2) : 1) && Math.floor(Math.round((e - t / 2 + Math.random() * (r - e + t * 0.99)) / t) * t * i) / i;
  });
}, Vu = function() {
  for (var e = arguments.length, r = new Array(e), t = 0; t < e; t++)
    r[t] = arguments[t];
  return function(i) {
    return r.reduce(function(n, s) {
      return s(n);
    }, i);
  };
}, Uu = function(e, r) {
  return function(t) {
    return e(parseFloat(t)) + (r || $e(t));
  };
}, Wu = function(e, r, t) {
  return wa(e, r, 0, 1, t);
}, ba = function(e, r, t) {
  return Er(t, function(i) {
    return e[~~r(i)];
  });
}, $u = function a(e, r, t) {
  var i = r - e;
  return He(e) ? ba(e, a(0, e.length), r) : Er(t, function(n) {
    return (i + (n - e) % i) % i + e;
  });
}, Gu = function a(e, r, t) {
  var i = r - e, n = i * 2;
  return He(e) ? ba(e, a(0, e.length - 1), r) : Er(t, function(s) {
    return s = (n + (s - e) % n) % n || 0, e + (s > i ? n - s : s);
  });
}, en = function(e) {
  return e.replace(Cu, function(r) {
    var t = r.indexOf("[") + 1, i = r.substring(t || 7, t ? r.indexOf("]") : r.length - 1).split(Pu);
    return xa(t ? i : +i[0], t ? 0 : +i[1], +i[2] || 1e-5);
  });
}, wa = function(e, r, t, i, n) {
  var s = r - e, o = i - t;
  return Er(n, function(u) {
    return t + ((u - e) / s * o || 0);
  });
}, Hu = function a(e, r, t, i) {
  var n = isNaN(e + r) ? 0 : function(c) {
    return (1 - c) * e + c * r;
  };
  if (!n) {
    var s = Re(e), o = {}, u, l, f, _, d;
    if (t === !0 && (i = 1) && (t = null), s)
      e = {
        p: e
      }, r = {
        p: r
      };
    else if (He(e) && !He(r)) {
      for (f = [], _ = e.length, d = _ - 2, l = 1; l < _; l++)
        f.push(a(e[l - 1], e[l]));
      _--, n = function(p) {
        p *= _;
        var h = Math.min(d, ~~p);
        return f[h](p - h);
      }, t = r;
    } else i || (e = xi(He(e) ? [] : {}, e));
    if (!f) {
      for (u in r)
        Ks.call(o, e, u, "get", r[u]);
      n = function(p) {
        return Js(p, o) || (s ? e.p : e);
      };
    }
  }
  return Er(t, n);
}, bo = function(e, r, t) {
  var i = e.labels, n = Dt, s, o, u;
  for (s in i)
    o = i[s] - r, o < 0 == !!t && o && n > (o = Math.abs(o)) && (u = s, n = o);
  return u;
}, bt = function(e, r, t) {
  var i = e.vars, n = i[r], s = ae, o = e._ctx, u, l, f;
  if (n)
    return u = i[r + "Params"], l = i.callbackScope || e, t && Tr.length && Xn(), o && (ae = o), f = u ? n.apply(l, u) : n.call(l), ae = s, f;
}, Ai = function(e) {
  return Pr(e), e.scrollTrigger && e.scrollTrigger.kill(!!Ie), e.progress() < 1 && bt(e, "onInterrupt"), e;
}, ci, Ta = [], Sa = function(e) {
  if (e)
    if (e = !e.name && e.default || e, qs() || e.headless) {
      var r = e.name, t = ge(e), i = r && !t && e.init ? function() {
        this._props = [];
      } : e, n = {
        init: Ji,
        render: Js,
        add: Ks,
        kill: cl,
        modifier: fl,
        rawVars: 0
      }, s = {
        targetTest: 0,
        get: 0,
        getSetter: js,
        aliases: {},
        register: 0
      };
      if (Ti(), e !== i) {
        if (yt[r])
          return;
        kt(i, kt(qn(e, n), s)), xi(i.prototype, xi(n, qn(e, s))), yt[i.prop = r] = i, e.targetTest && (En.push(i), Ws[r] = 1), r = (r === "css" ? "CSS" : r.charAt(0).toUpperCase() + r.substr(1)) + "Plugin";
      }
      oa(r, i), e.register && e.register(ht, i, ft);
    } else
      Ta.push(e);
}, ne = 255, zi = {
  aqua: [0, ne, ne],
  lime: [0, ne, 0],
  silver: [192, 192, 192],
  black: [0, 0, 0],
  maroon: [128, 0, 0],
  teal: [0, 128, 128],
  blue: [0, 0, ne],
  navy: [0, 0, 128],
  white: [ne, ne, ne],
  olive: [128, 128, 0],
  yellow: [ne, ne, 0],
  orange: [ne, 165, 0],
  gray: [128, 128, 128],
  purple: [128, 0, 128],
  green: [0, 128, 0],
  red: [ne, 0, 0],
  pink: [ne, 192, 203],
  cyan: [0, ne, ne],
  transparent: [ne, ne, ne, 0]
}, os = function(e, r, t) {
  return e += e < 0 ? 1 : e > 1 ? -1 : 0, (e * 6 < 1 ? r + (t - r) * e * 6 : e < 0.5 ? t : e * 3 < 2 ? r + (t - r) * (2 / 3 - e) * 6 : r) * ne + 0.5 | 0;
}, ka = function(e, r, t) {
  var i = e ? ur(e) ? [e >> 16, e >> 8 & ne, e & ne] : 0 : zi.black, n, s, o, u, l, f, _, d, c, p;
  if (!i) {
    if (e.substr(-1) === "," && (e = e.substr(0, e.length - 1)), zi[e])
      i = zi[e];
    else if (e.charAt(0) === "#") {
      if (e.length < 6 && (n = e.charAt(1), s = e.charAt(2), o = e.charAt(3), e = "#" + n + n + s + s + o + o + (e.length === 5 ? e.charAt(4) + e.charAt(4) : "")), e.length === 9)
        return i = parseInt(e.substr(1, 6), 16), [i >> 16, i >> 8 & ne, i & ne, parseInt(e.substr(7), 16) / 255];
      e = parseInt(e.substr(1), 16), i = [e >> 16, e >> 8 & ne, e & ne];
    } else if (e.substr(0, 3) === "hsl") {
      if (i = p = e.match(go), !r)
        u = +i[0] % 360 / 360, l = +i[1] / 100, f = +i[2] / 100, s = f <= 0.5 ? f * (l + 1) : f + l - f * l, n = f * 2 - s, i.length > 3 && (i[3] *= 1), i[0] = os(u + 1 / 3, n, s), i[1] = os(u, n, s), i[2] = os(u - 1 / 3, n, s);
      else if (~e.indexOf("="))
        return i = e.match(ra), t && i.length < 4 && (i[3] = 1), i;
    } else
      i = e.match(go) || zi.transparent;
    i = i.map(Number);
  }
  return r && !p && (n = i[0] / ne, s = i[1] / ne, o = i[2] / ne, _ = Math.max(n, s, o), d = Math.min(n, s, o), f = (_ + d) / 2, _ === d ? u = l = 0 : (c = _ - d, l = f > 0.5 ? c / (2 - _ - d) : c / (_ + d), u = _ === n ? (s - o) / c + (s < o ? 6 : 0) : _ === s ? (o - n) / c + 2 : (n - s) / c + 4, u *= 60), i[0] = ~~(u + 0.5), i[1] = ~~(l * 100 + 0.5), i[2] = ~~(f * 100 + 0.5)), t && i.length < 4 && (i[3] = 1), i;
}, Ca = function(e) {
  var r = [], t = [], i = -1;
  return e.split(Sr).forEach(function(n) {
    var s = n.match(fi) || [];
    r.push.apply(r, s), t.push(i += s.length + 1);
  }), r.c = t, r;
}, wo = function(e, r, t) {
  var i = "", n = (e + i).match(Sr), s = r ? "hsla(" : "rgba(", o = 0, u, l, f, _;
  if (!n)
    return e;
  if (n = n.map(function(d) {
    return (d = ka(d, r, 1)) && s + (r ? d[0] + "," + d[1] + "%," + d[2] + "%," + d[3] : d.join(",")) + ")";
  }), t && (f = Ca(e), u = t.c, u.join(i) !== f.c.join(i)))
    for (l = e.replace(Sr, "1").split(fi), _ = l.length - 1; o < _; o++)
      i += l[o] + (~u.indexOf(o) ? n.shift() || s + "0,0,0,0)" : (f.length ? f : n.length ? n : t).shift());
  if (!l)
    for (l = e.split(Sr), _ = l.length - 1; o < _; o++)
      i += l[o] + n[o];
  return i + l[_];
}, Sr = (function() {
  var a = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b", e;
  for (e in zi)
    a += "|" + e + "\\b";
  return new RegExp(a + ")", "gi");
})(), Ku = /hsl[a]?\(/, Pa = function(e) {
  var r = e.join(" "), t;
  if (Sr.lastIndex = 0, Sr.test(r))
    return t = Ku.test(r), e[1] = wo(e[1], t), e[0] = wo(e[0], t, Ca(e[1])), !0;
}, tn, xt = (function() {
  var a = Date.now, e = 500, r = 33, t = a(), i = t, n = 1e3 / 240, s = n, o = [], u, l, f, _, d, c, p = function h(m) {
    var w = a() - i, b = m === !0, S, x, T, O;
    if ((w > e || w < 0) && (t += w - r), i += w, T = i - t, S = T - s, (S > 0 || b) && (O = ++_.frame, d = T - _.time * 1e3, _.time = T = T / 1e3, s += S + (S >= n ? 0 : n - S), x = 1), b || (u = l(h)), x)
      for (c = 0; c < o.length; c++)
        o[c](T, d, O, m);
  };
  return _ = {
    time: 0,
    frame: 0,
    tick: function() {
      p(!0);
    },
    deltaRatio: function(m) {
      return d / (1e3 / (m || 60));
    },
    wake: function() {
      na && (!vs && qs() && (Ut = vs = window, Vs = Ut.document || {}, St.gsap = ht, (Ut.gsapVersions || (Ut.gsapVersions = [])).push(ht.version), sa(Yn || Ut.GreenSockGlobals || !Ut.gsap && Ut || {}), Ta.forEach(Sa)), f = typeof requestAnimationFrame < "u" && requestAnimationFrame, u && _.sleep(), l = f || function(m) {
        return setTimeout(m, s - _.time * 1e3 + 1 | 0);
      }, tn = 1, p(2));
    },
    sleep: function() {
      (f ? cancelAnimationFrame : clearTimeout)(u), tn = 0, l = Ji;
    },
    lagSmoothing: function(m, w) {
      e = m || 1 / 0, r = Math.min(w || 33, e);
    },
    fps: function(m) {
      n = 1e3 / (m || 240), s = _.time * 1e3 + n;
    },
    add: function(m, w, b) {
      var S = w ? function(x, T, O, v) {
        m(x, T, O, v), _.remove(S);
      } : m;
      return _.remove(m), o[b ? "unshift" : "push"](S), Ti(), S;
    },
    remove: function(m, w) {
      ~(w = o.indexOf(m)) && o.splice(w, 1) && c >= w && c--;
    },
    _listeners: o
  }, _;
})(), Ti = function() {
  return !tn && xt.wake();
}, G = {}, Qu = /^[\d.\-M][\d.\-,\s]/, Zu = /["']/g, ju = function(e) {
  for (var r = {}, t = e.substr(1, e.length - 3).split(":"), i = t[0], n = 1, s = t.length, o, u, l; n < s; n++)
    u = t[n], o = n !== s - 1 ? u.lastIndexOf(",") : u.length, l = u.substr(0, o), r[i] = isNaN(l) ? l.replace(Zu, "").trim() : +l, i = u.substr(o + 1).trim();
  return r;
}, Ju = function(e) {
  var r = e.indexOf("(") + 1, t = e.indexOf(")"), i = e.indexOf("(", r);
  return e.substring(r, ~i && i < t ? e.indexOf(")", t + 1) : t);
}, el = function(e) {
  var r = (e + "").split("("), t = G[r[0]];
  return t && r.length > 1 && t.config ? t.config.apply(null, ~e.indexOf("{") ? [ju(r[1])] : Ju(e).split(",").map(fa)) : G._CE && Qu.test(e) ? G._CE("", e) : t;
}, tl = function(e) {
  return function(r) {
    return 1 - e(1 - r);
  };
}, $r = function(e, r) {
  return e && (ge(e) ? e : G[e] || el(e)) || r;
}, ei = function(e, r, t, i) {
  t === void 0 && (t = function(u) {
    return 1 - r(1 - u);
  }), i === void 0 && (i = function(u) {
    return u < 0.5 ? r(u * 2) / 2 : 1 - r((1 - u) * 2) / 2;
  });
  var n = {
    easeIn: r,
    easeOut: t,
    easeInOut: i
  }, s;
  return lt(e, function(o) {
    G[o] = St[o] = n, G[s = o.toLowerCase()] = t;
    for (var u in n)
      G[s + (u === "easeIn" ? ".in" : u === "easeOut" ? ".out" : ".inOut")] = G[o + "." + u] = n[u];
  }), n;
}, Oa = function(e) {
  return function(r) {
    return r < 0.5 ? (1 - e(1 - r * 2)) / 2 : 0.5 + e((r - 0.5) * 2) / 2;
  };
}, as = function a(e, r, t) {
  var i = r >= 1 ? r : 1, n = (t || (e ? 0.3 : 0.45)) / (r < 1 ? r : 1), s = n / ys * (Math.asin(1 / i) || 0), o = function(f) {
    return f === 1 ? 1 : i * Math.pow(2, -10 * f) * ku((f - s) * n) + 1;
  }, u = e === "out" ? o : e === "in" ? function(l) {
    return 1 - o(1 - l);
  } : Oa(o);
  return n = ys / n, u.config = function(l, f) {
    return a(e, l, f);
  }, u;
}, us = function a(e, r) {
  r === void 0 && (r = 1.70158);
  var t = function(s) {
    return s ? --s * s * ((r + 1) * s + r) + 1 : 0;
  }, i = e === "out" ? t : e === "in" ? function(n) {
    return 1 - t(1 - n);
  } : Oa(t);
  return i.config = function(n) {
    return a(e, n);
  }, i;
};
lt("Linear,Quad,Cubic,Quart,Quint,Strong", function(a, e) {
  var r = e < 5 ? e + 1 : e;
  ei(a + ",Power" + (r - 1), e ? function(t) {
    return Math.pow(t, r);
  } : function(t) {
    return t;
  }, function(t) {
    return 1 - Math.pow(1 - t, r);
  }, function(t) {
    return t < 0.5 ? Math.pow(t * 2, r) / 2 : 1 - Math.pow((1 - t) * 2, r) / 2;
  });
});
G.Linear.easeNone = G.none = G.Linear.easeIn;
ei("Elastic", as("in"), as("out"), as());
(function(a, e) {
  var r = 1 / e, t = 2 * r, i = 2.5 * r, n = function(o) {
    return o < r ? a * o * o : o < t ? a * Math.pow(o - 1.5 / e, 2) + 0.75 : o < i ? a * (o -= 2.25 / e) * o + 0.9375 : a * Math.pow(o - 2.625 / e, 2) + 0.984375;
  };
  ei("Bounce", function(s) {
    return 1 - n(1 - s);
  }, n);
})(7.5625, 2.75);
ei("Expo", function(a) {
  return Math.pow(2, 10 * (a - 1)) * a + a * a * a * a * a * a * (1 - a);
});
ei("Circ", function(a) {
  return -(ea(1 - a * a) - 1);
});
ei("Sine", function(a) {
  return a === 1 ? 1 : -Su(a * wu) + 1;
});
ei("Back", us("in"), us("out"), us());
G.SteppedEase = G.steps = St.SteppedEase = {
  config: function(e, r) {
    e === void 0 && (e = 1);
    var t = 1 / e, i = e + (r ? 0 : 1), n = r ? 1 : 0, s = 1 - te;
    return function(o) {
      return ((i * fn(0, s, o) | 0) + n) * t;
    };
  }
};
Zi.ease = G["quad.out"];
lt("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt", function(a) {
  return $s += a + "," + a + "Params,";
});
var Ma = function(e, r) {
  this.id = Tu++, e._gsap = this, this.target = e, this.harness = r, this.get = r ? r.get : ua, this.set = r ? r.getSetter : js;
}, rn = /* @__PURE__ */ (function() {
  function a(r) {
    this.vars = r, this._delay = +r.delay || 0, (this._repeat = r.repeat === 1 / 0 ? -2 : r.repeat || 0) && (this._rDelay = r.repeatDelay || 0, this._yoyo = !!r.yoyo || !!r.yoyoEase), this._ts = 1, wi(this, +r.duration, 1, 1), this.data = r.data, ae && (this._ctx = ae, ae.data.push(this)), tn || xt.wake();
  }
  var e = a.prototype;
  return e.delay = function(t) {
    return t || t === 0 ? (this.parent && this.parent.smoothChildTiming && this.startTime(this._start + t - this._delay), this._delay = t, this) : this._delay;
  }, e.duration = function(t) {
    return arguments.length ? this.totalDuration(this._repeat > 0 ? t + (t + this._rDelay) * this._repeat : t) : this.totalDuration() && this._dur;
  }, e.totalDuration = function(t) {
    return arguments.length ? (this._dirty = 0, wi(this, this._repeat < 0 ? t : (t - this._repeat * this._rDelay) / (this._repeat + 1))) : this._tDur;
  }, e.totalTime = function(t, i) {
    if (Ti(), !arguments.length)
      return this._tTime;
    var n = this._dp;
    if (n && n.smoothChildTiming && this._ts) {
      for (ts(this, t), !n._dp || n.parent || _a(n, this); n && n.parent; )
        n.parent._time !== n._start + (n._ts >= 0 ? n._tTime / n._ts : (n.totalDuration() - n._tTime) / -n._ts) && n.totalTime(n._tTime, !0), n = n.parent;
      !this.parent && this._dp.autoRemoveChildren && (this._ts > 0 && t < this._tDur || this._ts < 0 && t > 0 || !this._tDur && !t) && $t(this._dp, this, this._start - this._delay);
    }
    return (this._tTime !== t || !this._dur && !i || this._initted && Math.abs(this._zTime) === te || !this._initted && this._dur && t || !t && !this._initted && (this.add || this._ptLookup)) && (this._ts || (this._pTime = t), la(this, t, i)), this;
  }, e.time = function(t, i) {
    return arguments.length ? this.totalTime(Math.min(this.totalDuration(), t + vo(this)) % (this._dur + this._rDelay) || (t ? this._dur : 0), i) : this._time;
  }, e.totalProgress = function(t, i) {
    return arguments.length ? this.totalTime(this.totalDuration() * t, i) : this.totalDuration() ? Math.min(1, this._tTime / this._tDur) : this.rawTime() >= 0 && this._initted ? 1 : 0;
  }, e.progress = function(t, i) {
    return arguments.length ? this.totalTime(this.duration() * (this._yoyo && !(this.iteration() & 1) ? 1 - t : t) + vo(this), i) : this.duration() ? Math.min(1, this._time / this._dur) : this.rawTime() > 0 ? 1 : 0;
  }, e.iteration = function(t, i) {
    var n = this.duration() + this._rDelay;
    return arguments.length ? this.totalTime(this._time + (t - 1) * n, i) : this._repeat ? bi(this._tTime, n) + 1 : 1;
  }, e.timeScale = function(t, i) {
    if (!arguments.length)
      return this._rts === -te ? 0 : this._rts;
    if (this._rts === t)
      return this;
    var n = this.parent && this._ts ? Vn(this.parent._time, this) : this._tTime, s = this._rts < 0;
    this._rts = +t || 0, this._ts = this._ps || t === -te ? 0 : this._rts;
    var o = this.totalDuration();
    return (s !== this._rts < 0 || n > 0 && n < o) && this.totalTime(fn(-Math.abs(this._delay), o, n), i !== !1), es(this), Fu(this);
  }, e.paused = function(t) {
    if (!arguments.length)
      return this._ps;
    if (this._ps !== t)
      if (this._ps = t, t)
        this._pTime = this._tTime || Math.max(-this._delay, this.rawTime()), this._ts = this._act = 0;
      else {
        Ti(), this._ts = this._rts;
        var i = this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime, n = this.progress() === 1 && Math.abs(this._zTime) !== te, s;
        if (n)
          for (this._tTime -= te, s = this._first; s; ) {
            if (!s._dur && s._zTime < 0 && s._ts && s._start <= i + te) {
              n = !1;
              break;
            }
            s = s._next;
          }
        this.totalTime(i, n);
      }
    return this;
  }, e.startTime = function(t) {
    if (arguments.length) {
      this._start = le(t);
      var i = this.parent || this._dp;
      return i && (i._sort || !this.parent) && $t(i, this, this._start - this._delay), this;
    }
    return this._start;
  }, e.endTime = function(t) {
    return this._start + (ut(t) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1);
  }, e.rawTime = function(t) {
    var i = this.parent || this._dp;
    return i ? t && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : this._ts ? Vn(i.rawTime(t), this) : this._tTime : this._tTime;
  }, e.revert = function(t) {
    t === void 0 && (t = Eu);
    var i = Ie;
    return Ie = t, Hs(this) && (this.timeline && this.timeline.revert(t), this.totalTime(-0.01, t.suppressEvents)), this.data !== "nested" && t.kill !== !1 && this.kill(), Ie = i, this;
  }, e.globalTime = function(t) {
    for (var i = this, n = arguments.length ? t : i.rawTime(); i; )
      n = i._start + n / (Math.abs(i._ts) || 1), i = i._dp;
    return !this.parent && this._sat ? this._sat.globalTime(t) : n;
  }, e.repeat = function(t) {
    return arguments.length ? (this._repeat = t === 1 / 0 ? -2 : t, xo(this)) : this._repeat === -2 ? 1 / 0 : this._repeat;
  }, e.repeatDelay = function(t) {
    if (arguments.length) {
      var i = this._time;
      return this._rDelay = t, xo(this), i ? this.time(i) : this;
    }
    return this._rDelay;
  }, e.yoyo = function(t) {
    return arguments.length ? (this._yoyo = t, this) : this._yoyo;
  }, e.seek = function(t, i) {
    return this.totalTime(Pt(this, t), ut(i));
  }, e.restart = function(t, i) {
    return this.play().totalTime(t ? -this._delay : 0, ut(i)), this._dur || (this._zTime = -te), this;
  }, e.play = function(t, i) {
    return t != null && this.seek(t, i), this.reversed(!1).paused(!1);
  }, e.reverse = function(t, i) {
    return t != null && this.seek(t || this.totalDuration(), i), this.reversed(!0).paused(!1);
  }, e.pause = function(t, i) {
    return t != null && this.seek(t, i), this.paused(!0);
  }, e.resume = function() {
    return this.paused(!1);
  }, e.reversed = function(t) {
    return arguments.length ? (!!t !== this.reversed() && this.timeScale(-this._rts || (t ? -te : 0)), this) : this._rts < 0;
  }, e.invalidate = function() {
    return this._initted = this._act = 0, this._zTime = -te, this;
  }, e.isActive = function() {
    var t = this.parent || this._dp, i = this._start, n;
    return !!(!t || this._ts && this._initted && t.isActive() && (n = t.rawTime(!0)) >= i && n < this.endTime(!0) - te);
  }, e.eventCallback = function(t, i, n) {
    var s = this.vars;
    return arguments.length > 1 ? (i ? (s[t] = i, n && (s[t + "Params"] = n), t === "onUpdate" && (this._onUpdate = i)) : delete s[t], this) : s[t];
  }, e.then = function(t) {
    var i = this, n = i._prom;
    return new Promise(function(s) {
      var o = ge(t) ? t : ca, u = function() {
        var f = i.then;
        i.then = null, n && n(), ge(o) && (o = o(i)) && (o.then || o === i) && (i.then = f), s(o), i.then = f;
      };
      i._initted && i.totalProgress() === 1 && i._ts >= 0 || !i._tTime && i._ts < 0 ? u() : i._prom = u;
    });
  }, e.kill = function() {
    Ai(this);
  }, a;
})();
kt(rn.prototype, {
  _time: 0,
  _start: 0,
  _end: 0,
  _tTime: 0,
  _tDur: 0,
  _dirty: 0,
  _repeat: 0,
  _yoyo: !1,
  parent: null,
  _initted: !1,
  _rDelay: 0,
  _ts: 1,
  _dp: 0,
  ratio: 0,
  _zTime: -te,
  _prom: 0,
  _ps: !1,
  _rts: 1
});
var ot = /* @__PURE__ */ (function(a) {
  Jo(e, a);
  function e(t, i) {
    var n;
    return t === void 0 && (t = {}), n = a.call(this, t) || this, n.labels = {}, n.smoothChildTiming = !!t.smoothChildTiming, n.autoRemoveChildren = !!t.autoRemoveChildren, n._sort = ut(t.sortChildren), fe && $t(t.parent || fe, rr(n), i), t.reversed && n.reverse(), t.paused && n.paused(!0), t.scrollTrigger && da(rr(n), t.scrollTrigger), n;
  }
  var r = e.prototype;
  return r.to = function(i, n, s) {
    return Xi(0, arguments, this), this;
  }, r.from = function(i, n, s) {
    return Xi(1, arguments, this), this;
  }, r.fromTo = function(i, n, s, o) {
    return Xi(2, arguments, this), this;
  }, r.set = function(i, n, s) {
    return n.duration = 0, n.parent = this, Yi(n).repeatDelay || (n.repeat = 0), n.immediateRender = !!n.immediateRender, new Se(i, n, Pt(this, s), 1), this;
  }, r.call = function(i, n, s) {
    return $t(this, Se.delayedCall(0, i, n), s);
  }, r.staggerTo = function(i, n, s, o, u, l, f) {
    return s.duration = n, s.stagger = s.stagger || o, s.onComplete = l, s.onCompleteParams = f, s.parent = this, new Se(i, s, Pt(this, u)), this;
  }, r.staggerFrom = function(i, n, s, o, u, l, f) {
    return s.runBackwards = 1, Yi(s).immediateRender = ut(s.immediateRender), this.staggerTo(i, n, s, o, u, l, f);
  }, r.staggerFromTo = function(i, n, s, o, u, l, f, _) {
    return o.startAt = s, Yi(o).immediateRender = ut(o.immediateRender), this.staggerTo(i, n, o, u, l, f, _);
  }, r.render = function(i, n, s) {
    var o = this._time, u = this._dirty ? this.totalDuration() : this._tDur, l = this._dur, f = i <= 0 ? 0 : le(i), _ = this._zTime < 0 != i < 0 && (this._initted || !l), d, c, p, h, m, w, b, S, x, T, O, v;
    if (this !== fe && f > u && i >= 0 && (f = u), f !== this._tTime || s || _) {
      if (o !== this._time && l && (f += this._time - o, i += this._time - o), d = f, x = this._start, S = this._ts, w = !S, _ && (l || (o = this._zTime), (i || !n) && (this._zTime = i)), this._repeat) {
        if (O = this._yoyo, m = l + this._rDelay, this._repeat < -1 && i < 0)
          return this.totalTime(m * 100 + i, n, s);
        if (d = le(f % m), f === u ? (h = this._repeat, d = l) : (T = le(f / m), h = ~~T, h && h === T && (d = l, h--), d > l && (d = l)), T = bi(this._tTime, m), !o && this._tTime && T !== h && this._tTime - T * m - this._dur <= 0 && (T = h), O && h & 1 && (d = l - d, v = 1), h !== T && !this._lock) {
          var P = O && T & 1, C = P === (O && h & 1);
          if (h < T && (P = !P), o = P ? 0 : f % l ? l : f, this._lock = 1, this.render(o || (v ? 0 : le(h * m)), n, !l)._lock = 0, this._tTime = f, !n && this.parent && bt(this, "onRepeat"), this.vars.repeatRefresh && !v && (this.invalidate()._lock = 1, T = h), o && o !== this._time || w !== !this._ts || this.vars.onRepeat && !this.parent && !this._act)
            return this;
          if (l = this._dur, u = this._tDur, C && (this._lock = 2, o = P ? l : -1e-4, this.render(o, !0), this.vars.repeatRefresh && !v && this.invalidate()), this._lock = 0, !this._ts && !w)
            return this;
        }
      }
      if (this._hasPause && !this._forcing && this._lock < 2 && (b = Nu(this, le(o), le(d)), b && (f -= d - (d = b._start))), this._tTime = f, this._time = d, this._act = !!S, this._initted || (this._onUpdate = this.vars.onUpdate, this._initted = 1, this._zTime = i, o = 0), !o && f && l && !n && !T && (bt(this, "onStart"), this._tTime !== f))
        return this;
      if (d >= o && i >= 0)
        for (c = this._first; c; ) {
          if (p = c._next, (c._act || d >= c._start) && c._ts && b !== c) {
            if (c.parent !== this)
              return this.render(i, n, s);
            if (c.render(c._ts > 0 ? (d - c._start) * c._ts : (c._dirty ? c.totalDuration() : c._tDur) + (d - c._start) * c._ts, n, s), d !== this._time || !this._ts && !w) {
              b = 0, p && (f += this._zTime = -te);
              break;
            }
          }
          c = p;
        }
      else {
        c = this._last;
        for (var k = i < 0 ? i : d; c; ) {
          if (p = c._prev, (c._act || k <= c._end) && c._ts && b !== c) {
            if (c.parent !== this)
              return this.render(i, n, s);
            if (c.render(c._ts > 0 ? (k - c._start) * c._ts : (c._dirty ? c.totalDuration() : c._tDur) + (k - c._start) * c._ts, n, s || Ie && Hs(c)), d !== this._time || !this._ts && !w) {
              b = 0, p && (f += this._zTime = k ? -te : te);
              break;
            }
          }
          c = p;
        }
      }
      if (b && !n && (this.pause(), b.render(d >= o ? 0 : -te)._zTime = d >= o ? 1 : -1, this._ts))
        return this._start = x, es(this), this.render(i, n, s);
      this._onUpdate && !n && bt(this, "onUpdate", !0), (f === u && this._tTime >= this.totalDuration() || !f && o) && (x === this._start || Math.abs(S) !== Math.abs(this._ts)) && (this._lock || ((i || !l) && (f === u && this._ts > 0 || !f && this._ts < 0) && Pr(this, 1), !n && !(i < 0 && !o) && (f || o || !u) && (bt(this, f === u && i >= 0 ? "onComplete" : "onReverseComplete", !0), this._prom && !(f < u && this.timeScale() > 0) && this._prom())));
    }
    return this;
  }, r.add = function(i, n) {
    var s = this;
    if (ur(n) || (n = Pt(this, n, i)), !(i instanceof rn)) {
      if (He(i))
        return i.forEach(function(o) {
          return s.add(o, n);
        }), this;
      if (Re(i))
        return this.addLabel(i, n);
      if (ge(i))
        i = Se.delayedCall(0, i);
      else
        return this;
    }
    return this !== i ? $t(this, i, n) : this;
  }, r.getChildren = function(i, n, s, o) {
    i === void 0 && (i = !0), n === void 0 && (n = !0), s === void 0 && (s = !0), o === void 0 && (o = -Dt);
    for (var u = [], l = this._first; l; )
      l._start >= o && (l instanceof Se ? n && u.push(l) : (s && u.push(l), i && u.push.apply(u, l.getChildren(!0, n, s)))), l = l._next;
    return u;
  }, r.getById = function(i) {
    for (var n = this.getChildren(1, 1, 1), s = n.length; s--; )
      if (n[s].vars.id === i)
        return n[s];
  }, r.remove = function(i) {
    return Re(i) ? this.removeLabel(i) : ge(i) ? this.killTweensOf(i) : (i.parent === this && Jn(this, i), i === this._recent && (this._recent = this._last), Wr(this));
  }, r.totalTime = function(i, n) {
    return arguments.length ? (this._forcing = 1, !this._dp && this._ts && (this._start = le(xt.time - (this._ts > 0 ? i / this._ts : (this.totalDuration() - i) / -this._ts))), a.prototype.totalTime.call(this, i, n), this._forcing = 0, this) : this._tTime;
  }, r.addLabel = function(i, n) {
    return this.labels[i] = Pt(this, n), this;
  }, r.removeLabel = function(i) {
    return delete this.labels[i], this;
  }, r.addPause = function(i, n, s) {
    var o = Se.delayedCall(0, n || Ji, s);
    return o.data = "isPause", this._hasPause = 1, $t(this, o, Pt(this, i));
  }, r.removePause = function(i) {
    var n = this._first;
    for (i = Pt(this, i); n; )
      n._start === i && n.data === "isPause" && Pr(n), n = n._next;
  }, r.killTweensOf = function(i, n, s) {
    for (var o = this.getTweensOf(i, s), u = o.length; u--; )
      mr !== o[u] && o[u].kill(i, n);
    return this;
  }, r.getTweensOf = function(i, n) {
    for (var s = [], o = Et(i), u = this._first, l = ur(n), f; u; )
      u instanceof Se ? Ru(u._targets, o) && (l ? (!mr || u._initted && u._ts) && u.globalTime(0) <= n && u.globalTime(u.totalDuration()) > n : !n || u.isActive()) && s.push(u) : (f = u.getTweensOf(o, n)).length && s.push.apply(s, f), u = u._next;
    return s;
  }, r.tweenTo = function(i, n) {
    n = n || {};
    var s = this, o = Pt(s, i), u = n, l = u.startAt, f = u.onStart, _ = u.onStartParams, d = u.immediateRender, c, p = Se.to(s, kt({
      ease: n.ease || "none",
      lazy: !1,
      immediateRender: !1,
      time: o,
      overwrite: "auto",
      duration: n.duration || Math.abs((o - (l && "time" in l ? l.time : s._time)) / s.timeScale()) || te,
      onStart: function() {
        if (s.pause(), !c) {
          var m = n.duration || Math.abs((o - (l && "time" in l ? l.time : s._time)) / s.timeScale());
          p._dur !== m && wi(p, m, 0, 1).render(p._time, !0, !0), c = 1;
        }
        f && f.apply(p, _ || []);
      }
    }, n));
    return d ? p.render(0) : p;
  }, r.tweenFromTo = function(i, n, s) {
    return this.tweenTo(n, kt({
      startAt: {
        time: Pt(this, i)
      }
    }, s));
  }, r.recent = function() {
    return this._recent;
  }, r.nextLabel = function(i) {
    return i === void 0 && (i = this._time), bo(this, Pt(this, i));
  }, r.previousLabel = function(i) {
    return i === void 0 && (i = this._time), bo(this, Pt(this, i), 1);
  }, r.currentLabel = function(i) {
    return arguments.length ? this.seek(i, !0) : this.previousLabel(this._time + te);
  }, r.shiftChildren = function(i, n, s) {
    s === void 0 && (s = 0);
    var o = this._first, u = this.labels, l;
    for (i = le(i); o; )
      o._start >= s && (o._start += i, o._end += i), o = o._next;
    if (n)
      for (l in u)
        u[l] >= s && (u[l] += i);
    return Wr(this);
  }, r.invalidate = function(i) {
    var n = this._first;
    for (this._lock = 0; n; )
      n.invalidate(i), n = n._next;
    return a.prototype.invalidate.call(this, i);
  }, r.clear = function(i) {
    i === void 0 && (i = !0);
    for (var n = this._first, s; n; )
      s = n._next, this.remove(n), n = s;
    return this._dp && (this._time = this._tTime = this._pTime = 0), i && (this.labels = {}), Wr(this);
  }, r.totalDuration = function(i) {
    var n = 0, s = this, o = s._last, u = Dt, l, f, _;
    if (arguments.length)
      return s.timeScale((s._repeat < 0 ? s.duration() : s.totalDuration()) / (s.reversed() ? -i : i));
    if (s._dirty) {
      for (_ = s.parent; o; )
        l = o._prev, o._dirty && o.totalDuration(), f = o._start, f > u && s._sort && o._ts && !s._lock ? (s._lock = 1, $t(s, o, f - o._delay, 1)._lock = 0) : u = f, f < 0 && o._ts && (n -= f, (!_ && !s._dp || _ && _.smoothChildTiming) && (s._start += le(f / s._ts), s._time -= f, s._tTime -= f), s.shiftChildren(-f, !1, -1 / 0), u = 0), o._end > n && o._ts && (n = o._end), o = l;
      wi(s, s === fe && s._time > n ? s._time : n, 1, 1), s._dirty = 0;
    }
    return s._tDur;
  }, e.updateRoot = function(i) {
    if (fe._ts && (la(fe, Vn(i, fe)), aa = xt.frame), xt.frame >= mo) {
      mo += Tt.autoSleep || 120;
      var n = fe._first;
      if ((!n || !n._ts) && Tt.autoSleep && xt._listeners.length < 2) {
        for (; n && !n._ts; )
          n = n._next;
        n || xt.sleep();
      }
    }
  }, e;
})(rn);
kt(ot.prototype, {
  _lock: 0,
  _hasPause: 0,
  _forcing: 0
});
var rl = function(e, r, t, i, n, s, o) {
  var u = new ft(this._pt, e, r, 0, 1, za, null, n), l = 0, f = 0, _, d, c, p, h, m, w, b;
  for (u.b = t, u.e = i, t += "", i += "", (w = ~i.indexOf("random(")) && (i = en(i)), s && (b = [t, i], s(b, e, r), t = b[0], i = b[1]), d = t.match(ns) || []; _ = ns.exec(i); )
    p = _[0], h = i.substring(l, _.index), c ? c = (c + 1) % 5 : h.substr(-5) === "rgba(" && (c = 1), p !== d[f++] && (m = parseFloat(d[f - 1]) || 0, u._pt = {
      _next: u._pt,
      p: h || f === 1 ? h : ",",
      //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
      s: m,
      c: p.charAt(1) === "=" ? _i(m, p) - m : parseFloat(p) - m,
      m: c && c < 4 ? Math.round : 0
    }, l = ns.lastIndex);
  return u.c = l < i.length ? i.substring(l, i.length) : "", u.fp = o, (ia.test(i) || w) && (u.e = 0), this._pt = u, u;
}, Ks = function(e, r, t, i, n, s, o, u, l, f) {
  ge(i) && (i = i(n || 0, e, s));
  var _ = e[r], d = t !== "get" ? t : ge(_) ? l ? e[r.indexOf("set") || !ge(e["get" + r.substr(3)]) ? r : "get" + r.substr(3)](l) : e[r]() : _, c = ge(_) ? l ? al : Ra : Zs, p;
  if (Re(i) && (~i.indexOf("random(") && (i = en(i)), i.charAt(1) === "=" && (p = _i(d, i) + ($e(d) || 0), (p || p === 0) && (i = p))), !f || d !== i || ks)
    return !isNaN(d * i) && i !== "" ? (p = new ft(this._pt, e, r, +d || 0, i - (d || 0), typeof _ == "boolean" ? ll : Aa, 0, c), l && (p.fp = l), o && p.modifier(o, this, e), this._pt = p) : (!_ && !(r in e) && Us(r, i), rl.call(this, e, r, d, i, c, u || Tt.stringFilter, l));
}, il = function(e, r, t, i, n) {
  if (ge(e) && (e = qi(e, n, r, t, i)), !Qt(e) || e.style && e.nodeType || He(e) || ta(e))
    return Re(e) ? qi(e, n, r, t, i) : e;
  var s = {}, o;
  for (o in e)
    s[o] = qi(e[o], n, r, t, i);
  return s;
}, Da = function(e, r, t, i, n, s) {
  var o, u, l, f;
  if (yt[e] && (o = new yt[e]()).init(n, o.rawVars ? r[e] : il(r[e], i, n, s, t), t, i, s) !== !1 && (t._pt = u = new ft(t._pt, n, e, 0, 1, o.render, o, 0, o.priority), t !== ci))
    for (l = t._ptLookup[t._targets.indexOf(n)], f = o._props.length; f--; )
      l[o._props[f]] = u;
  return o;
}, mr, ks, Qs = function a(e, r, t) {
  var i = e.vars, n = i.ease, s = i.startAt, o = i.immediateRender, u = i.lazy, l = i.onUpdate, f = i.runBackwards, _ = i.yoyoEase, d = i.keyframes, c = i.autoRevert, p = e._dur, h = e._startAt, m = e._targets, w = e.parent, b = w && w.data === "nested" ? w.vars.targets : m, S = e._overwrite === "auto" && !Ys, x = e.timeline, T = i.easeReverse || _, O, v, P, C, k, N, D, H, I, K, W, A, Q;
  if (x && (!d || !n) && (n = "none"), e._ease = $r(n, Zi.ease), e._rEase = T && ($r(T) || e._ease), e._from = !x && !!i.runBackwards, e._from && (e.ratio = 1), !x || d && !i.stagger) {
    if (H = m[0] ? Ur(m[0]).harness : 0, A = H && i[H.prop], O = qn(i, Ws), h && (h._zTime < 0 && h.progress(1), r < 0 && f && o && !c ? h.render(-1, !0) : h.revert(f && p ? Dn : Du), h._lazy = 0), s) {
      if (Pr(e._startAt = Se.set(m, kt({
        data: "isStart",
        overwrite: !1,
        parent: w,
        immediateRender: !0,
        lazy: !h && ut(u),
        startAt: null,
        delay: 0,
        onUpdate: l && function() {
          return bt(e, "onUpdate");
        },
        stagger: 0
      }, s))), e._startAt._dp = 0, e._startAt._sat = e, r < 0 && (Ie || !o && !c) && e._startAt.revert(Dn), o && p && r <= 0 && t <= 0) {
        r && (e._zTime = r);
        return;
      }
    } else if (f && p && !h) {
      if (r && (o = !1), P = kt({
        overwrite: !1,
        data: "isFromStart",
        //we tag the tween with as "isFromStart" so that if [inside a plugin] we need to only do something at the very END of a tween, we have a way of identifying this tween as merely the one that's setting the beginning values for a "from()" tween. For example, clearProps in CSSPlugin should only get applied at the very END of a tween and without this tag, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in.
        lazy: o && !h && ut(u),
        immediateRender: o,
        //zero-duration tweens render immediately by default, but if we're not specifically instructed to render this tween immediately, we should skip this and merely _init() to record the starting values (rendering them immediately would push them to completion which is wasteful in that case - we'd have to render(-1) immediately after)
        stagger: 0,
        parent: w
        //ensures that nested tweens that had a stagger are handled properly, like gsap.from(".class", {y: gsap.utils.wrap([-100,100]), stagger: 0.5})
      }, O), A && (P[H.prop] = A), Pr(e._startAt = Se.set(m, P)), e._startAt._dp = 0, e._startAt._sat = e, r < 0 && (Ie ? e._startAt.revert(Dn) : e._startAt.render(-1, !0)), e._zTime = r, !o)
        a(e._startAt, te, te);
      else if (!r)
        return;
    }
    for (e._pt = e._ptCache = 0, u = p && ut(u) || u && !p, v = 0; v < m.length; v++) {
      if (k = m[v], D = k._gsap || Gs(m)[v]._gsap, e._ptLookup[v] = K = {}, xs[D.id] && Tr.length && Xn(), W = b === m ? v : b.indexOf(k), H && (I = new H()).init(k, A || O, e, W, b) !== !1 && (e._pt = C = new ft(e._pt, k, I.name, 0, 1, I.render, I, 0, I.priority), I._props.forEach(function(re) {
        K[re] = C;
      }), I.priority && (N = 1)), !H || A)
        for (P in O)
          yt[P] && (I = Da(P, O, e, W, k, b)) ? I.priority && (N = 1) : K[P] = C = Ks.call(e, k, P, "get", O[P], W, b, 0, i.stringFilter);
      e._op && e._op[v] && e.kill(k, e._op[v]), S && e._pt && (mr = e, fe.killTweensOf(k, K, e.globalTime(r)), Q = !e.parent, mr = 0), e._pt && u && (xs[D.id] = 1);
    }
    N && Fa(e), e._onInit && e._onInit(e);
  }
  e._onUpdate = l, e._initted = (!e._op || e._pt) && !Q, d && r <= 0 && x.render(Dt, !0, !0);
}, nl = function(e, r, t, i, n, s, o, u) {
  var l = (e._pt && e._ptCache || (e._ptCache = {}))[r], f, _, d, c;
  if (!l)
    for (l = e._ptCache[r] = [], d = e._ptLookup, c = e._targets.length; c--; ) {
      if (f = d[c][r], f && f.d && f.d._pt)
        for (f = f.d._pt; f && f.p !== r && f.fp !== r; )
          f = f._next;
      if (!f)
        return ks = 1, e.vars[r] = "+=0", Qs(e, o), ks = 0, u ? ji(r + " not eligible for reset. Try splitting into individual properties") : 1;
      l.push(f);
    }
  for (c = l.length; c--; )
    _ = l[c], f = _._pt || _, f.s = (i || i === 0) && !n ? i : f.s + (i || 0) + s * f.c, f.c = t - f.s, _.e && (_.e = xe(t) + $e(_.e)), _.b && (_.b = f.s + $e(_.b));
}, sl = function(e, r) {
  var t = e[0] ? Ur(e[0]).harness : 0, i = t && t.aliases, n, s, o, u;
  if (!i)
    return r;
  n = xi({}, r);
  for (s in i)
    if (s in n)
      for (u = i[s].split(","), o = u.length; o--; )
        n[u[o]] = n[s];
  return n;
}, ol = function(e, r, t, i) {
  var n = r.ease || i || "power1.inOut", s, o;
  if (He(r))
    o = t[e] || (t[e] = []), r.forEach(function(u, l) {
      return o.push({
        t: l / (r.length - 1) * 100,
        v: u,
        e: n
      });
    });
  else
    for (s in r)
      o = t[s] || (t[s] = []), s === "ease" || o.push({
        t: parseFloat(e),
        v: r[s],
        e: n
      });
}, qi = function(e, r, t, i, n) {
  return ge(e) ? e.call(r, t, i, n) : Re(e) && ~e.indexOf("random(") ? en(e) : e;
}, Wn = $s + "repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,easeReverse,autoRevert", Ea = {};
lt(Wn + ",id,stagger,delay,duration,paused,scrollTrigger", function(a) {
  return Ea[a] = 1;
});
Wn = Wn.split(",");
var Se = /* @__PURE__ */ (function(a) {
  Jo(e, a);
  function e(t, i, n, s) {
    var o;
    typeof i == "number" && (n.duration = i, i = n, n = null), o = a.call(this, s ? i : Yi(i)) || this;
    var u = o.vars, l = u.duration, f = u.delay, _ = u.immediateRender, d = u.stagger, c = u.overwrite, p = u.keyframes, h = u.defaults, m = u.scrollTrigger, w = i.parent || fe, b = (He(t) || ta(t) ? ur(t[0]) : "length" in i) ? [t] : Et(t), S, x, T, O, v, P, C, k;
    if (o._targets = b.length ? Gs(b) : ji("GSAP target " + t + " not found. https://gsap.com", !Tt.nullTargetWarn) || [], o._ptLookup = [], o._overwrite = c, p || d || gn(l) || gn(f)) {
      i = o.vars;
      var N = i.easeReverse || i.yoyoEase;
      if (S = o.timeline = new ot({
        data: "nested",
        defaults: h || {},
        targets: w && w.data === "nested" ? w.vars.targets : b
      }), S.kill(), S.parent = S._dp = rr(o), S._start = 0, d || gn(l) || gn(f)) {
        if (O = b.length, C = d && ya(d), Qt(d))
          for (v in d)
            ~Wn.indexOf(v) && (k || (k = {}), k[v] = d[v]);
        for (x = 0; x < O; x++)
          T = qn(i, Ea), T.stagger = 0, N && (T.easeReverse = N), k && xi(T, k), P = b[x], T.duration = +qi(l, rr(o), x, P, b), T.delay = (+qi(f, rr(o), x, P, b) || 0) - o._delay, !d && O === 1 && T.delay && (o._delay = f = T.delay, o._start += f, T.delay = 0), S.to(P, T, C ? C(x, P, b) : 0), S._ease = G.none;
        S.duration() ? l = f = 0 : o.timeline = 0;
      } else if (p) {
        Yi(kt(S.vars.defaults, {
          ease: "none"
        })), S._ease = $r(p.ease || i.ease || "none");
        var D = 0, H, I, K;
        if (He(p))
          p.forEach(function(W) {
            return S.to(b, W, ">");
          }), S.duration();
        else {
          T = {};
          for (v in p)
            v === "ease" || v === "easeEach" || ol(v, p[v], T, p.easeEach);
          for (v in T)
            for (H = T[v].sort(function(W, A) {
              return W.t - A.t;
            }), D = 0, x = 0; x < H.length; x++)
              I = H[x], K = {
                ease: I.e,
                duration: (I.t - (x ? H[x - 1].t : 0)) / 100 * l
              }, K[v] = I.v, S.to(b, K, D), D += K.duration;
          S.duration() < l && S.to({}, {
            duration: l - S.duration()
          });
        }
      }
      l || o.duration(l = S.duration());
    } else
      o.timeline = 0;
    return c === !0 && !Ys && (mr = rr(o), fe.killTweensOf(b), mr = 0), $t(w, rr(o), n), i.reversed && o.reverse(), i.paused && o.paused(!0), (_ || !l && !p && o._start === le(w._time) && ut(_) && Lu(rr(o)) && w.data !== "nested") && (o._tTime = -te, o.render(Math.max(0, -f) || 0)), m && da(rr(o), m), o;
  }
  var r = e.prototype;
  return r.render = function(i, n, s) {
    var o = this._time, u = this._tDur, l = this._dur, f = i < 0, _ = i > u - te && !f ? u : i < te ? 0 : i, d, c, p, h, m, w, b, S;
    if (!l)
      Bu(this, i, n, s);
    else if (_ !== this._tTime || !i || s || !this._initted && this._tTime || this._startAt && this._zTime < 0 !== f || this._lazy) {
      if (d = _, S = this.timeline, this._repeat) {
        if (h = l + this._rDelay, this._repeat < -1 && f)
          return this.totalTime(h * 100 + i, n, s);
        if (d = le(_ % h), _ === u ? (p = this._repeat, d = l) : (m = le(_ / h), p = ~~m, p && p === m ? (d = l, p--) : d > l && (d = l)), w = this._yoyo && p & 1, w && (d = l - d), m = bi(this._tTime, h), d === o && !s && this._initted && p === m)
          return this._tTime = _, this;
        p !== m && this.vars.repeatRefresh && !w && !this._lock && d !== h && this._initted && (this._lock = s = 1, this.render(le(h * p), !0).invalidate()._lock = 0);
      }
      if (!this._initted) {
        if (pa(this, f ? i : d, s, n, _))
          return this._tTime = 0, this;
        if (o !== this._time && !(s && this.vars.repeatRefresh && p !== m))
          return this;
        if (l !== this._dur)
          return this.render(i, n, s);
      }
      if (this._rEase) {
        var x = d < o;
        if (x !== this._inv) {
          var T = x ? o : l - o;
          this._inv = x, this._from && (this.ratio = 1 - this.ratio), this._invRatio = this.ratio, this._invTime = o, this._invRecip = T ? (x ? -1 : 1) / T : 0, this._invScale = x ? -this.ratio : 1 - this.ratio, this._invEase = x ? this._rEase : this._ease;
        }
        this.ratio = b = this._invRatio + this._invScale * this._invEase((d - this._invTime) * this._invRecip);
      } else
        this.ratio = b = this._ease(d / l);
      if (this._from && (this.ratio = b = 1 - b), this._tTime = _, this._time = d, !this._act && this._ts && (this._act = 1, this._lazy = 0), !o && _ && !n && !m && (bt(this, "onStart"), this._tTime !== _))
        return this;
      for (c = this._pt; c; )
        c.r(b, c.d), c = c._next;
      S && S.render(i < 0 ? i : S._dur * S._ease(d / this._dur), n, s) || this._startAt && (this._zTime = i), this._onUpdate && !n && (f && bs(this, i, n, s), bt(this, "onUpdate")), this._repeat && p !== m && this.vars.onRepeat && !n && this.parent && bt(this, "onRepeat"), (_ === this._tDur || !_) && this._tTime === _ && (f && !this._onUpdate && bs(this, i, !0, !0), (i || !l) && (_ === this._tDur && this._ts > 0 || !_ && this._ts < 0) && Pr(this, 1), !n && !(f && !o) && (_ || o || w) && (bt(this, _ === u ? "onComplete" : "onReverseComplete", !0), this._prom && !(_ < u && this.timeScale() > 0) && this._prom()));
    }
    return this;
  }, r.targets = function() {
    return this._targets;
  }, r.invalidate = function(i) {
    return (!i || !this.vars.runBackwards) && (this._startAt = 0), this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0, this._ptLookup = [], this.timeline && this.timeline.invalidate(i), a.prototype.invalidate.call(this, i);
  }, r.resetTo = function(i, n, s, o, u) {
    tn || xt.wake(), this._ts || this.play();
    var l = Math.min(this._dur, (this._dp._time - this._start) * this._ts), f;
    return this._initted || Qs(this, l), f = this._ease(l / this._dur), nl(this, i, n, s, o, f, l, u) ? this.resetTo(i, n, s, o, 1) : (ts(this, 0), this.parent || ha(this._dp, this, "_first", "_last", this._dp._sort ? "_start" : 0), this.render(0));
  }, r.kill = function(i, n) {
    if (n === void 0 && (n = "all"), !i && (!n || n === "all"))
      return this._lazy = this._pt = 0, this.parent ? Ai(this) : this.scrollTrigger && this.scrollTrigger.kill(!!Ie), this;
    if (this.timeline) {
      var s = this.timeline.totalDuration();
      return this.timeline.killTweensOf(i, n, mr && mr.vars.overwrite !== !0)._first || Ai(this), this.parent && s !== this.timeline.totalDuration() && wi(this, this._dur * this.timeline._tDur / s, 0, 1), this;
    }
    var o = this._targets, u = i ? Et(i) : o, l = this._ptLookup, f = this._pt, _, d, c, p, h, m, w;
    if ((!n || n === "all") && zu(o, u))
      return n === "all" && (this._pt = 0), Ai(this);
    for (_ = this._op = this._op || [], n !== "all" && (Re(n) && (h = {}, lt(n, function(b) {
      return h[b] = 1;
    }), n = h), n = sl(o, n)), w = o.length; w--; )
      if (~u.indexOf(o[w])) {
        d = l[w], n === "all" ? (_[w] = n, p = d, c = {}) : (c = _[w] = _[w] || {}, p = n);
        for (h in p)
          m = d && d[h], m && ((!("kill" in m.d) || m.d.kill(h) === !0) && Jn(this, m, "_pt"), delete d[h]), c !== "all" && (c[h] = 1);
      }
    return this._initted && !this._pt && f && Ai(this), this;
  }, e.to = function(i, n) {
    return new e(i, n, arguments[2]);
  }, e.from = function(i, n) {
    return Xi(1, arguments);
  }, e.delayedCall = function(i, n, s, o) {
    return new e(n, 0, {
      immediateRender: !1,
      lazy: !1,
      overwrite: !1,
      delay: i,
      onComplete: n,
      onReverseComplete: n,
      onCompleteParams: s,
      onReverseCompleteParams: s,
      callbackScope: o
    });
  }, e.fromTo = function(i, n, s) {
    return Xi(2, arguments);
  }, e.set = function(i, n) {
    return n.duration = 0, n.repeatDelay || (n.repeat = 0), new e(i, n);
  }, e.killTweensOf = function(i, n, s) {
    return fe.killTweensOf(i, n, s);
  }, e;
})(rn);
kt(Se.prototype, {
  _targets: [],
  _lazy: 0,
  _startAt: 0,
  _op: 0,
  _onInit: 0
});
lt("staggerTo,staggerFrom,staggerFromTo", function(a) {
  Se[a] = function() {
    var e = new ot(), r = ws.call(arguments, 0);
    return r.splice(a === "staggerFromTo" ? 5 : 4, 0, 0), e[a].apply(e, r);
  };
});
var Zs = function(e, r, t) {
  return e[r] = t;
}, Ra = function(e, r, t) {
  return e[r](t);
}, al = function(e, r, t, i) {
  return e[r](i.fp, t);
}, ul = function(e, r, t) {
  return e.setAttribute(r, t);
}, js = function(e, r) {
  return ge(e[r]) ? Ra : Xs(e[r]) && e.setAttribute ? ul : Zs;
}, Aa = function(e, r) {
  return r.set(r.t, r.p, Math.round((r.s + r.c * e) * 1e6) / 1e6, r);
}, ll = function(e, r) {
  return r.set(r.t, r.p, !!(r.s + r.c * e), r);
}, za = function(e, r) {
  var t = r._pt, i = "";
  if (!e && r.b)
    i = r.b;
  else if (e === 1 && r.e)
    i = r.e;
  else {
    for (; t; )
      i = t.p + (t.m ? t.m(t.s + t.c * e) : Math.round((t.s + t.c * e) * 1e4) / 1e4) + i, t = t._next;
    i += r.c;
  }
  r.set(r.t, r.p, i, r);
}, Js = function(e, r) {
  for (var t = r._pt; t; )
    t.r(e, t.d), t = t._next;
}, fl = function(e, r, t, i) {
  for (var n = this._pt, s; n; )
    s = n._next, n.p === i && n.modifier(e, r, t), n = s;
}, cl = function(e) {
  for (var r = this._pt, t, i; r; )
    i = r._next, r.p === e && !r.op || r.op === e ? Jn(this, r, "_pt") : r.dep || (t = 1), r = i;
  return !t;
}, hl = function(e, r, t, i) {
  i.mSet(e, r, i.m.call(i.tween, t, i.mt), i);
}, Fa = function(e) {
  for (var r = e._pt, t, i, n, s; r; ) {
    for (t = r._next, i = n; i && i.pr > r.pr; )
      i = i._next;
    (r._prev = i ? i._prev : s) ? r._prev._next = r : n = r, (r._next = i) ? i._prev = r : s = r, r = t;
  }
  e._pt = n;
}, ft = /* @__PURE__ */ (function() {
  function a(r, t, i, n, s, o, u, l, f) {
    this.t = t, this.s = n, this.c = s, this.p = i, this.r = o || Aa, this.d = u || this, this.set = l || Zs, this.pr = f || 0, this._next = r, r && (r._prev = this);
  }
  var e = a.prototype;
  return e.modifier = function(t, i, n) {
    this.mSet = this.mSet || this.set, this.set = hl, this.m = t, this.mt = n, this.tween = i;
  }, a;
})();
lt($s + "parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger,easeReverse", function(a) {
  return Ws[a] = 1;
});
St.TweenMax = St.TweenLite = Se;
St.TimelineLite = St.TimelineMax = ot;
fe = new ot({
  sortChildren: !1,
  defaults: Zi,
  autoRemoveChildren: !0,
  id: "root",
  smoothChildTiming: !0
});
Tt.stringFilter = Pa;
var Gr = [], Rn = {}, _l = [], To = 0, dl = 0, ls = function(e) {
  return (Rn[e] || _l).map(function(r) {
    return r();
  });
}, nn = function() {
  var e = Date.now(), r = [];
  e - To > 2 && (ls("matchMediaInit"), Gr.forEach(function(t) {
    var i = t.queries, n = t.conditions, s, o, u, l;
    for (o in i)
      s = Ut.matchMedia(i[o]).matches, s && (u = 1), s !== n[o] && (n[o] = s, l = 1);
    l && (t.revert(), u && r.push(t));
  }), ls("matchMediaRevert"), r.forEach(function(t) {
    return t.onMatch(t, function(i) {
      return t.add(null, i);
    });
  }), To = e, ls("matchMedia"));
}, La = /* @__PURE__ */ (function() {
  function a(r, t) {
    this.selector = t && Ts(t), this.data = [], this._r = [], this.isReverted = !1, this.id = dl++, r && this.add(r);
  }
  var e = a.prototype;
  return e.add = function(t, i, n) {
    ge(t) && (n = i, i = t, t = ge);
    var s = this, o = function() {
      var l = ae, f = s.selector, _;
      return l && l !== s && l.data.push(s), n && (s.selector = Ts(n)), ae = s, _ = i.apply(s, arguments), ge(_) && s._r.push(_), ae = l, s.selector = f, s.isReverted = !1, _;
    };
    return s.last = o, t === ge ? o(s, function(u) {
      return s.add(null, u);
    }) : t ? s[t] = o : o;
  }, e.ignore = function(t) {
    var i = ae;
    ae = null, t(this), ae = i;
  }, e.getTweens = function() {
    var t = [];
    return this.data.forEach(function(i) {
      return i instanceof a ? t.push.apply(t, i.getTweens()) : i instanceof Se && !(i.parent && i.parent.data === "nested") && t.push(i);
    }), t;
  }, e.clear = function() {
    this._r.length = this.data.length = 0;
  }, e.kill = function(t, i) {
    var n = this;
    if (t ? (function() {
      for (var o = n.getTweens(), u = n.data.length, l; u--; )
        l = n.data[u], l.data === "isFlip" && (l.revert(), l.getChildren(!0, !0, !1).forEach(function(f) {
          return o.splice(o.indexOf(f), 1);
        }));
      for (o.map(function(f) {
        return {
          g: f._dur || f._delay || f._sat && !f._sat.vars.immediateRender ? f.globalTime(0) : -1 / 0,
          t: f
        };
      }).sort(function(f, _) {
        return _.g - f.g || -1 / 0;
      }).forEach(function(f) {
        return f.t.revert(t);
      }), u = n.data.length; u--; )
        l = n.data[u], l instanceof ot ? l.data !== "nested" && (l.scrollTrigger && l.scrollTrigger.revert(), l.kill()) : !(l instanceof Se) && l.revert && l.revert(t);
      n._r.forEach(function(f) {
        return f(t, n);
      }), n.isReverted = !0;
    })() : this.data.forEach(function(o) {
      return o.kill && o.kill();
    }), this.clear(), i) {
      for (var s = Gr.length; s--; )
        Gr[s].id === this.id && Gr.splice(s, 1);
      this._mqs && this._mqs.forEach(function(o) {
        return o.removeListener ? o.removeListener(nn) : o.removeEventListener("change", nn);
      }), this._mqs = null;
    }
  }, e.revert = function(t) {
    this.kill(t || {});
  }, a;
})(), pl = /* @__PURE__ */ (function() {
  function a(r) {
    this.contexts = [], this.scope = r, ae && ae.data.push(this);
  }
  var e = a.prototype;
  return e.add = function(t, i, n) {
    Qt(t) || (t = {
      matches: t
    });
    var s = new La(0, n || this.scope), o = s.conditions = {}, u, l, f;
    ae && !s.selector && (s.selector = ae.selector), this.contexts.push(s), i = s.add("onMatch", i), s.queries = t;
    for (l in t)
      l === "all" ? f = 1 : (u = Ut.matchMedia(t[l]), u && (Gr.indexOf(s) < 0 && Gr.push(s), (o[l] = u.matches) && (f = 1), u.addListener ? u.addListener(nn) : u.addEventListener("change", nn), (s._mqs || (s._mqs = [])).push(u)));
    return f && i(s, function(_) {
      return s.add(null, _);
    }), this;
  }, e.revert = function(t) {
    this.kill(t || {});
  }, e.kill = function(t) {
    this.contexts.forEach(function(i) {
      return i.kill(t, !0);
    });
  }, a;
})(), $n = {
  registerPlugin: function() {
    for (var e = arguments.length, r = new Array(e), t = 0; t < e; t++)
      r[t] = arguments[t];
    r.forEach(function(i) {
      return Sa(i);
    });
  },
  timeline: function(e) {
    return new ot(e);
  },
  getTweensOf: function(e, r) {
    return fe.getTweensOf(e, r);
  },
  getProperty: function(e, r, t, i) {
    Re(e) && (e = Et(e)[0]);
    var n = Ur(e || {}).get, s = t ? ca : fa;
    return t === "native" && (t = ""), e && (r ? s((yt[r] && yt[r].get || n)(e, r, t, i)) : function(o, u, l) {
      return s((yt[o] && yt[o].get || n)(e, o, u, l));
    });
  },
  quickSetter: function(e, r, t) {
    if (e = Et(e), e.length > 1) {
      var i = e.map(function(f) {
        return ht.quickSetter(f, r, t);
      }), n = i.length;
      return function(f) {
        for (var _ = n; _--; )
          i[_](f);
      };
    }
    e = e[0] || {};
    var s = yt[r], o = Ur(e), u = o.harness && (o.harness.aliases || {})[r] || r, l = s ? function(f) {
      var _ = new s();
      ci._pt = 0, _.init(e, t ? f + t : f, ci, 0, [e]), _.render(1, _), ci._pt && Js(1, ci);
    } : o.set(e, u);
    return s ? l : function(f) {
      return l(e, u, t ? f + t : f, o, 1);
    };
  },
  quickTo: function(e, r, t) {
    var i, n = ht.to(e, kt((i = {}, i[r] = "+=0.1", i.paused = !0, i.stagger = 0, i), t || {})), s = function(u, l, f) {
      return n.resetTo(r, u, l, f);
    };
    return s.tween = n, s;
  },
  isTweening: function(e) {
    return fe.getTweensOf(e, !0).length > 0;
  },
  defaults: function(e) {
    return e && e.ease && (e.ease = $r(e.ease, Zi.ease)), yo(Zi, e || {});
  },
  config: function(e) {
    return yo(Tt, e || {});
  },
  registerEffect: function(e) {
    var r = e.name, t = e.effect, i = e.plugins, n = e.defaults, s = e.extendTimeline;
    (i || "").split(",").forEach(function(o) {
      return o && !yt[o] && !St[o] && ji(r + " effect requires " + o + " plugin.");
    }), ss[r] = function(o, u, l) {
      return t(Et(o), kt(u || {}, n), l);
    }, s && (ot.prototype[r] = function(o, u, l) {
      return this.add(ss[r](o, Qt(u) ? u : (l = u) && {}, this), l);
    });
  },
  registerEase: function(e, r) {
    G[e] = $r(r);
  },
  parseEase: function(e, r) {
    return arguments.length ? $r(e, r) : G;
  },
  getById: function(e) {
    return fe.getById(e);
  },
  exportRoot: function(e, r) {
    e === void 0 && (e = {});
    var t = new ot(e), i, n;
    for (t.smoothChildTiming = ut(e.smoothChildTiming), fe.remove(t), t._dp = 0, t._time = t._tTime = fe._time, i = fe._first; i; )
      n = i._next, (r || !(!i._dur && i instanceof Se && i.vars.onComplete === i._targets[0])) && $t(t, i, i._start - i._delay), i = n;
    return $t(fe, t, 0), t;
  },
  context: function(e, r) {
    return e ? new La(e, r) : ae;
  },
  matchMedia: function(e) {
    return new pl(e);
  },
  matchMediaRefresh: function() {
    return Gr.forEach(function(e) {
      var r = e.conditions, t, i;
      for (i in r)
        r[i] && (r[i] = !1, t = 1);
      t && e.revert();
    }) || nn();
  },
  addEventListener: function(e, r) {
    var t = Rn[e] || (Rn[e] = []);
    ~t.indexOf(r) || t.push(r);
  },
  removeEventListener: function(e, r) {
    var t = Rn[e], i = t && t.indexOf(r);
    i >= 0 && t.splice(i, 1);
  },
  utils: {
    wrap: $u,
    wrapYoyo: Gu,
    distribute: ya,
    random: xa,
    snap: va,
    normalize: Wu,
    getUnit: $e,
    clamp: Xu,
    splitColor: ka,
    toArray: Et,
    selector: Ts,
    mapRange: wa,
    pipe: Vu,
    unitize: Uu,
    interpolate: Hu,
    shuffle: ma
  },
  install: sa,
  effects: ss,
  ticker: xt,
  updateRoot: ot.updateRoot,
  plugins: yt,
  globalTimeline: fe,
  core: {
    PropTween: ft,
    globals: oa,
    Tween: Se,
    Timeline: ot,
    Animation: rn,
    getCache: Ur,
    _removeLinkedListItem: Jn,
    reverting: function() {
      return Ie;
    },
    context: function(e) {
      return e && ae && (ae.data.push(e), e._ctx = ae), ae;
    },
    suppressOverwrites: function(e) {
      return Ys = e;
    }
  }
};
lt("to,from,fromTo,delayedCall,set,killTweensOf", function(a) {
  return $n[a] = Se[a];
});
xt.add(ot.updateRoot);
ci = $n.to({}, {
  duration: 0
});
var gl = function(e, r) {
  for (var t = e._pt; t && t.p !== r && t.op !== r && t.fp !== r; )
    t = t._next;
  return t;
}, ml = function(e, r) {
  var t = e._targets, i, n, s;
  for (i in r)
    for (n = t.length; n--; )
      s = e._ptLookup[n][i], s && (s = s.d) && (s._pt && (s = gl(s, i)), s && s.modifier && s.modifier(r[i], e, t[n], i));
}, fs = function(e, r) {
  return {
    name: e,
    headless: 1,
    rawVars: 1,
    //don't pre-process function-based values or "random()" strings.
    init: function(i, n, s) {
      s._onInit = function(o) {
        var u, l;
        if (Re(n) && (u = {}, lt(n, function(f) {
          return u[f] = 1;
        }), n = u), r) {
          u = {};
          for (l in n)
            u[l] = r(n[l]);
          n = u;
        }
        ml(o, n);
      };
    }
  };
}, ht = $n.registerPlugin({
  name: "attr",
  init: function(e, r, t, i, n) {
    var s, o, u;
    this.tween = t;
    for (s in r)
      u = e.getAttribute(s) || "", o = this.add(e, "setAttribute", (u || 0) + "", r[s], i, n, 0, 0, s), o.op = s, o.b = u, this._props.push(s);
  },
  render: function(e, r) {
    for (var t = r._pt; t; )
      Ie ? t.set(t.t, t.p, t.b, t) : t.r(e, t.d), t = t._next;
  }
}, {
  name: "endArray",
  headless: 1,
  init: function(e, r) {
    for (var t = r.length; t--; )
      this.add(e, t, e[t] || 0, r[t], 0, 0, 0, 0, 0, 1);
  }
}, fs("roundProps", Ss), fs("modifiers"), fs("snap", va)) || $n;
Se.version = ot.version = ht.version = "3.15.1";
na = 1;
qs() && Ti();
G.Power0;
G.Power1;
G.Power2;
G.Power3;
G.Power4;
G.Linear;
G.Quad;
G.Cubic;
G.Quart;
G.Quint;
G.Strong;
G.Elastic;
G.Back;
G.SteppedEase;
G.Bounce;
G.Sine;
G.Expo;
G.Circ;
var So, yr, di, eo, qr, ko, to, yl = function() {
  return typeof window < "u";
}, lr = {}, Nr = 180 / Math.PI, pi = Math.PI / 180, ni = Math.atan2, Co = 1e8, ro = /([A-Z])/g, vl = /(left|right|width|margin|padding|x)/i, xl = /[\s,\(]\S/, Gt = {
  autoAlpha: "opacity,visibility",
  scale: "scaleX,scaleY",
  alpha: "opacity"
}, Cs = function(e, r) {
  return r.set(r.t, r.p, Math.round((r.s + r.c * e) * 1e4) / 1e4 + r.u, r);
}, bl = function(e, r) {
  return r.set(r.t, r.p, e === 1 ? r.e : Math.round((r.s + r.c * e) * 1e4) / 1e4 + r.u, r);
}, wl = function(e, r) {
  return r.set(r.t, r.p, e ? Math.round((r.s + r.c * e) * 1e4) / 1e4 + r.u : r.b, r);
}, Tl = function(e, r) {
  return r.set(r.t, r.p, e === 1 ? r.e : e ? Math.round((r.s + r.c * e) * 1e4) / 1e4 + r.u : r.b, r);
}, Sl = function(e, r) {
  var t = r.s + r.c * e;
  r.set(r.t, r.p, ~~(t + (t < 0 ? -0.5 : 0.5)) + r.u, r);
}, Ia = function(e, r) {
  return r.set(r.t, r.p, e ? r.e : r.b, r);
}, Ba = function(e, r) {
  return r.set(r.t, r.p, e !== 1 ? r.b : r.e, r);
}, kl = function(e, r, t) {
  return e.style[r] = t;
}, Cl = function(e, r, t) {
  return e.style.setProperty(r, t);
}, Pl = function(e, r, t) {
  return e._gsap[r] = t;
}, Ol = function(e, r, t) {
  return e._gsap.scaleX = e._gsap.scaleY = t;
}, Ml = function(e, r, t, i, n) {
  var s = e._gsap;
  s.scaleX = s.scaleY = t, s.renderTransform(n, s);
}, Dl = function(e, r, t, i, n) {
  var s = e._gsap;
  s[r] = t, s.renderTransform(n, s);
}, ce = "transform", ct = ce + "Origin", El = function a(e, r) {
  var t = this, i = this.target, n = i.style, s = i._gsap;
  if (e in lr && n) {
    if (this.tfm = this.tfm || {}, e !== "transform")
      e = Gt[e] || e, ~e.indexOf(",") ? e.split(",").forEach(function(o) {
        return t.tfm[o] = ir(i, o);
      }) : this.tfm[e] = s.x ? s[e] : ir(i, e), e === ct && (this.tfm.zOrigin = s.zOrigin);
    else
      return Gt.transform.split(",").forEach(function(o) {
        return a.call(t, o, r);
      });
    if (this.props.indexOf(ce) >= 0)
      return;
    s.svg && (this.svgo = i.getAttribute("data-svg-origin"), this.props.push(ct, r, "")), e = ce;
  }
  (n || r) && this.props.push(e, r, n[e]);
}, Na = function(e) {
  e.translate && (e.removeProperty("translate"), e.removeProperty("scale"), e.removeProperty("rotate"));
}, Rl = function() {
  var e = this.props, r = this.target, t = r.style, i = r._gsap, n, s;
  for (n = 0; n < e.length; n += 3)
    e[n + 1] ? e[n + 1] === 2 ? r[e[n]](e[n + 2]) : r[e[n]] = e[n + 2] : e[n + 2] ? t[e[n]] = e[n + 2] : t.removeProperty(e[n].substr(0, 2) === "--" ? e[n] : e[n].replace(ro, "-$1").toLowerCase());
  if (this.tfm) {
    for (s in this.tfm)
      i[s] = this.tfm[s];
    i.svg && (i.renderTransform(), r.setAttribute("data-svg-origin", this.svgo || "")), n = to(), (!n || !n.isStart) && !t[ce] && (Na(t), i.zOrigin && t[ct] && (t[ct] += " " + i.zOrigin + "px", i.zOrigin = 0, i.renderTransform()), i.uncache = 1);
  }
}, Ya = function(e, r) {
  var t = {
    target: e,
    props: [],
    revert: Rl,
    save: El
  };
  return e._gsap || ht.core.getCache(e), r && e.style && e.nodeType && r.split(",").forEach(function(i) {
    return t.save(i);
  }), t;
}, Xa, Ps = function(e, r) {
  var t = yr.createElementNS ? yr.createElementNS((r || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), e) : yr.createElement(e);
  return t && t.style ? t : yr.createElement(e);
}, wt = function a(e, r, t) {
  var i = getComputedStyle(e);
  return i[r] || i.getPropertyValue(r.replace(ro, "-$1").toLowerCase()) || i.getPropertyValue(r) || !t && a(e, Si(r) || r, 1) || "";
}, Po = "O,Moz,ms,Ms,Webkit".split(","), Si = function(e, r, t) {
  var i = r || qr, n = i.style, s = 5;
  if (e in n && !t)
    return e;
  for (e = e.charAt(0).toUpperCase() + e.substr(1); s-- && !(Po[s] + e in n); )
    ;
  return s < 0 ? null : (s === 3 ? "ms" : s >= 0 ? Po[s] : "") + e;
}, Os = function() {
  yl() && window.document && (So = window, yr = So.document, di = yr.documentElement, qr = Ps("div") || {
    style: {}
  }, Ps("div"), ce = Si(ce), ct = ce + "Origin", qr.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0", Xa = !!Si("perspective"), to = ht.core.reverting, eo = 1);
}, Oo = function(e) {
  var r = e.ownerSVGElement, t = Ps("svg", r && r.getAttribute("xmlns") || "http://www.w3.org/2000/svg"), i = e.cloneNode(!0), n;
  i.style.display = "block", t.appendChild(i), di.appendChild(t);
  try {
    n = i.getBBox();
  } catch {
  }
  return t.removeChild(i), di.removeChild(t), n;
}, Mo = function(e, r) {
  for (var t = r.length; t--; )
    if (e.hasAttribute(r[t]))
      return e.getAttribute(r[t]);
}, qa = function(e) {
  var r, t;
  try {
    r = e.getBBox();
  } catch {
    r = Oo(e), t = 1;
  }
  return r && (r.width || r.height) || t || (r = Oo(e)), r && !r.width && !r.x && !r.y ? {
    x: +Mo(e, ["x", "cx", "x1"]) || 0,
    y: +Mo(e, ["y", "cy", "y1"]) || 0,
    width: 0,
    height: 0
  } : r;
}, Va = function(e) {
  return !!(e.getCTM && (!e.parentNode || e.ownerSVGElement) && qa(e));
}, Or = function(e, r) {
  if (r) {
    var t = e.style, i;
    r in lr && r !== ct && (r = ce), t.removeProperty ? (i = r.substr(0, 2), (i === "ms" || r.substr(0, 6) === "webkit") && (r = "-" + r), t.removeProperty(i === "--" ? r : r.replace(ro, "-$1").toLowerCase())) : t.removeAttribute(r);
  }
}, vr = function(e, r, t, i, n, s) {
  var o = new ft(e._pt, r, t, 0, 1, s ? Ba : Ia);
  return e._pt = o, o.b = i, o.e = n, e._props.push(t), o;
}, Do = {
  deg: 1,
  rad: 1,
  turn: 1
}, Al = {
  grid: 1,
  flex: 1
}, Mr = function a(e, r, t, i) {
  var n = parseFloat(t) || 0, s = (t + "").trim().substr((n + "").length) || "px", o = qr.style, u = vl.test(r), l = e.tagName.toLowerCase() === "svg", f = (l ? "client" : "offset") + (u ? "Width" : "Height"), _ = 100, d = i === "px", c = i === "%", p, h, m, w;
  if (i === s || !n || Do[i] || Do[s])
    return n;
  if (s !== "px" && !d && (n = a(e, r, t, "px")), w = e.getCTM && Va(e), (c || s === "%") && (lr[r] || ~r.indexOf("adius")))
    return p = w ? e.getBBox()[u ? "width" : "height"] : e[f], xe(c ? n / p * _ : n / 100 * p);
  if (o[u ? "width" : "height"] = _ + (d ? s : i), h = i !== "rem" && ~r.indexOf("adius") || i === "em" && e.appendChild && !l ? e : e.parentNode, w && (h = (e.ownerSVGElement || {}).parentNode), (!h || h === yr || !h.appendChild) && (h = yr.body), m = h._gsap, m && c && m.width && u && m.time === xt.time && !m.uncache)
    return xe(n / m.width * _);
  if (c && (r === "height" || r === "width")) {
    var b = e.style[r];
    e.style[r] = _ + i, p = e[f], b ? e.style[r] = b : Or(e, r);
  } else
    (c || s === "%") && !Al[wt(h, "display")] && (o.position = wt(e, "position")), h === e && (o.position = "static"), h.appendChild(qr), p = qr[f], h.removeChild(qr), o.position = "absolute";
  return u && c && (m = Ur(h), m.time = xt.time, m.width = h[f]), xe(d ? p * n / _ : p && n ? _ / p * n : 0);
}, ir = function(e, r, t, i) {
  var n;
  return eo || Os(), r in Gt && r !== "transform" && (r = Gt[r], ~r.indexOf(",") && (r = r.split(",")[0])), lr[r] && r !== "transform" ? (n = on(e, i), n = r !== "transformOrigin" ? n[r] : n.svg ? n.origin : Hn(wt(e, ct)) + " " + n.zOrigin + "px") : (n = e.style[r], (!n || n === "auto" || i || ~(n + "").indexOf("calc(")) && (n = Gn[r] && Gn[r](e, r, t) || wt(e, r) || ua(e, r) || (r === "opacity" ? 1 : 0))), t && !~(n + "").trim().indexOf(" ") ? Mr(e, r, n, t) + t : n;
}, zl = function(e, r, t, i) {
  if (!t || t === "none") {
    var n = Si(r, e, 1), s = n && wt(e, n, 1);
    s && s !== t ? (r = n, t = s) : r === "borderColor" && (t = wt(e, "borderTopColor"));
  }
  var o = new ft(this._pt, e.style, r, 0, 1, za), u = 0, l = 0, f, _, d, c, p, h, m, w, b, S, x, T;
  if (o.b = t, o.e = i, t += "", i += "", i.substring(0, 6) === "var(--" && (i = wt(e, i.substring(4, i.indexOf(")")))), i === "auto" && (h = e.style[r], e.style[r] = i, i = wt(e, r) || i, h ? e.style[r] = h : Or(e, r)), f = [t, i], Pa(f), t = f[0], i = f[1], d = t.match(fi) || [], T = i.match(fi) || [], T.length) {
    for (; _ = fi.exec(i); )
      m = _[0], b = i.substring(u, _.index), p ? p = (p + 1) % 5 : (b.substr(-5) === "rgba(" || b.substr(-5) === "hsla(") && (p = 1), m !== (h = d[l++] || "") && (c = parseFloat(h) || 0, x = h.substr((c + "").length), m.charAt(1) === "=" && (m = _i(c, m) + x), w = parseFloat(m), S = m.substr((w + "").length), u = fi.lastIndex - S.length, S || (S = S || Tt.units[r] || x, u === i.length && (i += S, o.e += S)), x !== S && (c = Mr(e, r, h, S) || 0), o._pt = {
        _next: o._pt,
        p: b || l === 1 ? b : ",",
        //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
        s: c,
        c: w - c,
        m: p && p < 4 || r === "zIndex" ? Math.round : 0
      });
    o.c = u < i.length ? i.substring(u, i.length) : "";
  } else
    o.r = r === "display" && i === "none" ? Ba : Ia;
  return ia.test(i) && (o.e = 0), this._pt = o, o;
}, Eo = {
  top: "0%",
  bottom: "100%",
  left: "0%",
  right: "100%",
  center: "50%"
}, Fl = function(e) {
  var r = e.split(" "), t = r[0], i = r[1] || "50%";
  return (t === "top" || t === "bottom" || i === "left" || i === "right") && (e = t, t = i, i = e), r[0] = Eo[t] || t, r[1] = Eo[i] || i, r.join(" ");
}, Ll = function(e, r) {
  if (r.tween && r.tween._time === r.tween._dur) {
    var t = r.t, i = t.style, n = r.u, s = t._gsap, o, u, l;
    if (n === "all" || n === !0)
      i.cssText = "", u = 1;
    else
      for (n = n.split(","), l = n.length; --l > -1; )
        o = n[l], lr[o] && (u = 1, o = o === "transformOrigin" ? ct : ce), Or(t, o);
    u && (Or(t, ce), s && (s.svg && t.removeAttribute("transform"), i.scale = i.rotate = i.translate = "none", on(t, 1), s.uncache = 1, Na(i)));
  }
}, Gn = {
  clearProps: function(e, r, t, i, n) {
    if (n.data !== "isFromStart") {
      var s = e._pt = new ft(e._pt, r, t, 0, 0, Ll);
      return s.u = i, s.pr = -10, s.tween = n, e._props.push(t), 1;
    }
  }
  /* className feature (about 0.4kb gzipped).
  , className(plugin, target, property, endValue, tween) {
  	let _renderClassName = (ratio, data) => {
  			data.css.render(ratio, data.css);
  			if (!ratio || ratio === 1) {
  				let inline = data.rmv,
  					target = data.t,
  					p;
  				target.setAttribute("class", ratio ? data.e : data.b);
  				for (p in inline) {
  					_removeProperty(target, p);
  				}
  			}
  		},
  		_getAllStyles = (target) => {
  			let styles = {},
  				computed = getComputedStyle(target),
  				p;
  			for (p in computed) {
  				if (isNaN(p) && p !== "cssText" && p !== "length") {
  					styles[p] = computed[p];
  				}
  			}
  			_setDefaults(styles, _parseTransform(target, 1));
  			return styles;
  		},
  		startClassList = target.getAttribute("class"),
  		style = target.style,
  		cssText = style.cssText,
  		cache = target._gsap,
  		classPT = cache.classPT,
  		inlineToRemoveAtEnd = {},
  		data = {t:target, plugin:plugin, rmv:inlineToRemoveAtEnd, b:startClassList, e:(endValue.charAt(1) !== "=") ? endValue : startClassList.replace(new RegExp("(?:\\s|^)" + endValue.substr(2) + "(?![\\w-])"), "") + ((endValue.charAt(0) === "+") ? " " + endValue.substr(2) : "")},
  		changingVars = {},
  		startVars = _getAllStyles(target),
  		transformRelated = /(transform|perspective)/i,
  		endVars, p;
  	if (classPT) {
  		classPT.r(1, classPT.d);
  		_removeLinkedListItem(classPT.d.plugin, classPT, "_pt");
  	}
  	target.setAttribute("class", data.e);
  	endVars = _getAllStyles(target, true);
  	target.setAttribute("class", startClassList);
  	for (p in endVars) {
  		if (endVars[p] !== startVars[p] && !transformRelated.test(p)) {
  			changingVars[p] = endVars[p];
  			if (!style[p] && style[p] !== "0") {
  				inlineToRemoveAtEnd[p] = 1;
  			}
  		}
  	}
  	cache.classPT = plugin._pt = new PropTween(plugin._pt, target, "className", 0, 0, _renderClassName, data, 0, -11);
  	if (style.cssText !== cssText) { //only apply if things change. Otherwise, in cases like a background-image that's pulled dynamically, it could cause a refresh. See https://gsap.com/forums/topic/20368-possible-gsap-bug-switching-classnames-in-chrome/.
  		style.cssText = cssText; //we recorded cssText before we swapped classes and ran _getAllStyles() because in cases when a className tween is overwritten, we remove all the related tweening properties from that class change (otherwise class-specific stuff can't override properties we've directly set on the target's style object due to specificity).
  	}
  	_parseTransform(target, true); //to clear the caching of transforms
  	data.css = new gsap.plugins.css();
  	data.css.init(target, changingVars, tween);
  	plugin._props.push(...data.css._props);
  	return 1;
  }
  */
}, sn = [1, 0, 0, 1, 0, 0], Ua = {}, Wa = function(e) {
  return e === "matrix(1, 0, 0, 1, 0, 0)" || e === "none" || !e;
}, Ro = function(e) {
  var r = wt(e, ce);
  return Wa(r) ? sn : r.substr(7).match(ra).map(xe);
}, io = function(e, r) {
  var t = e._gsap || Ur(e), i = e.style, n = Ro(e), s, o, u, l;
  return t.svg && e.getAttribute("transform") ? (u = e.transform.baseVal.consolidate().matrix, n = [u.a, u.b, u.c, u.d, u.e, u.f], n.join(",") === "1,0,0,1,0,0" ? sn : n) : (n === sn && !e.offsetParent && e !== di && !t.svg && (u = i.display, i.display = "block", s = e.parentNode, (!s || !e.offsetParent && !e.getBoundingClientRect().width) && (l = 1, o = e.nextElementSibling, di.appendChild(e)), n = Ro(e), u ? i.display = u : Or(e, "display"), l && (o ? s.insertBefore(e, o) : s ? s.appendChild(e) : di.removeChild(e))), r && n.length > 6 ? [n[0], n[1], n[4], n[5], n[12], n[13]] : n);
}, Ms = function(e, r, t, i, n, s) {
  var o = e._gsap, u = n || io(e, !0), l = o.xOrigin || 0, f = o.yOrigin || 0, _ = o.xOffset || 0, d = o.yOffset || 0, c = u[0], p = u[1], h = u[2], m = u[3], w = u[4], b = u[5], S = r.split(" "), x = parseFloat(S[0]) || 0, T = parseFloat(S[1]) || 0, O, v, P, C;
  t ? u !== sn && (v = c * m - p * h) && (P = x * (m / v) + T * (-h / v) + (h * b - m * w) / v, C = x * (-p / v) + T * (c / v) - (c * b - p * w) / v, x = P, T = C) : (O = qa(e), x = O.x + (~S[0].indexOf("%") ? x / 100 * O.width : x), T = O.y + (~(S[1] || S[0]).indexOf("%") ? T / 100 * O.height : T)), i || i !== !1 && o.smooth ? (w = x - l, b = T - f, o.xOffset = _ + (w * c + b * h) - w, o.yOffset = d + (w * p + b * m) - b) : o.xOffset = o.yOffset = 0, o.xOrigin = x, o.yOrigin = T, o.smooth = !!i, o.origin = r, o.originIsAbsolute = !!t, e.style[ct] = "0px 0px", s && (vr(s, o, "xOrigin", l, x), vr(s, o, "yOrigin", f, T), vr(s, o, "xOffset", _, o.xOffset), vr(s, o, "yOffset", d, o.yOffset)), e.setAttribute("data-svg-origin", x + " " + T);
}, on = function(e, r) {
  var t = e._gsap || new Ma(e);
  if ("x" in t && !r && !t.uncache)
    return t;
  var i = e.style, n = t.scaleX < 0, s = "px", o = "deg", u = getComputedStyle(e), l = wt(e, ct) || "0", f, _, d, c, p, h, m, w, b, S, x, T, O, v, P, C, k, N, D, H, I, K, W, A, Q, re, g, se, Ke, At, he, Ae;
  return f = _ = d = h = m = w = b = S = x = 0, c = p = 1, t.svg = !!(e.getCTM && Va(e)), u.translate && ((u.translate !== "none" || u.scale !== "none" || u.rotate !== "none") && (i[ce] = (u.translate !== "none" ? "translate3d(" + (u.translate + " 0 0").split(" ").slice(0, 3).join(", ") + ") " : "") + (u.rotate !== "none" ? "rotate(" + u.rotate + ") " : "") + (u.scale !== "none" ? "scale(" + u.scale.split(" ").join(",") + ") " : "") + (u[ce] !== "none" ? u[ce] : "")), i.scale = i.rotate = i.translate = "none"), v = io(e, t.svg), t.svg && (t.uncache ? (Q = e.getBBox(), l = t.xOrigin - Q.x + "px " + (t.yOrigin - Q.y) + "px", A = "") : A = !r && e.getAttribute("data-svg-origin"), Ms(e, A || l, !!A || t.originIsAbsolute, t.smooth !== !1, v)), T = t.xOrigin || 0, O = t.yOrigin || 0, v !== sn && (N = v[0], D = v[1], H = v[2], I = v[3], f = K = v[4], _ = W = v[5], v.length === 6 ? (c = Math.sqrt(N * N + D * D), p = Math.sqrt(I * I + H * H), h = N || D ? ni(D, N) * Nr : 0, b = H || I ? ni(H, I) * Nr + h : 0, b && (p *= Math.abs(Math.cos(b * pi))), t.svg && (f -= T - (T * N + O * H), _ -= O - (T * D + O * I))) : (Ae = v[6], At = v[7], g = v[8], se = v[9], Ke = v[10], he = v[11], f = v[12], _ = v[13], d = v[14], P = ni(Ae, Ke), m = P * Nr, P && (C = Math.cos(-P), k = Math.sin(-P), A = K * C + g * k, Q = W * C + se * k, re = Ae * C + Ke * k, g = K * -k + g * C, se = W * -k + se * C, Ke = Ae * -k + Ke * C, he = At * -k + he * C, K = A, W = Q, Ae = re), P = ni(-H, Ke), w = P * Nr, P && (C = Math.cos(-P), k = Math.sin(-P), A = N * C - g * k, Q = D * C - se * k, re = H * C - Ke * k, he = I * k + he * C, N = A, D = Q, H = re), P = ni(D, N), h = P * Nr, P && (C = Math.cos(P), k = Math.sin(P), A = N * C + D * k, Q = K * C + W * k, D = D * C - N * k, W = W * C - K * k, N = A, K = Q), m && Math.abs(m) + Math.abs(h) > 359.9 && (m = h = 0, w = 180 - w), c = xe(Math.sqrt(N * N + D * D + H * H)), p = xe(Math.sqrt(W * W + Ae * Ae)), P = ni(K, W), b = Math.abs(P) > 2e-4 ? P * Nr : 0, x = he ? 1 / (he < 0 ? -he : he) : 0), t.svg && (A = e.getAttribute("transform"), t.forceCSS = e.setAttribute("transform", "") || !Wa(wt(e, ce)), A && e.setAttribute("transform", A))), Math.abs(b) > 90 && Math.abs(b) < 270 && (n ? (c *= -1, b += h <= 0 ? 180 : -180, h += h <= 0 ? 180 : -180) : (p *= -1, b += b <= 0 ? 180 : -180)), r = r || t.uncache, t.x = f - ((t.xPercent = f && (!r && t.xPercent || (Math.round(e.offsetWidth / 2) === Math.round(-f) ? -50 : 0))) ? e.offsetWidth * t.xPercent / 100 : 0) + s, t.y = _ - ((t.yPercent = _ && (!r && t.yPercent || (Math.round(e.offsetHeight / 2) === Math.round(-_) ? -50 : 0))) ? e.offsetHeight * t.yPercent / 100 : 0) + s, t.z = d + s, t.scaleX = xe(c), t.scaleY = xe(p), t.rotation = xe(h) + o, t.rotationX = xe(m) + o, t.rotationY = xe(w) + o, t.skewX = b + o, t.skewY = S + o, t.transformPerspective = x + s, (t.zOrigin = parseFloat(l.split(" ")[2]) || !r && t.zOrigin || 0) && (i[ct] = Hn(l)), t.xOffset = t.yOffset = 0, t.force3D = Tt.force3D, t.renderTransform = t.svg ? Bl : Xa ? $a : Il, t.uncache = 0, t;
}, Hn = function(e) {
  return (e = e.split(" "))[0] + " " + e[1];
}, cs = function(e, r, t) {
  var i = $e(r);
  return xe(parseFloat(r) + parseFloat(Mr(e, "x", t + "px", i))) + i;
}, Il = function(e, r) {
  r.z = "0px", r.rotationY = r.rotationX = "0deg", r.force3D = 0, $a(e, r);
}, Ir = "0deg", Di = "0px", Br = ") ", $a = function(e, r) {
  var t = r || this, i = t.xPercent, n = t.yPercent, s = t.x, o = t.y, u = t.z, l = t.rotation, f = t.rotationY, _ = t.rotationX, d = t.skewX, c = t.skewY, p = t.scaleX, h = t.scaleY, m = t.transformPerspective, w = t.force3D, b = t.target, S = t.zOrigin, x = "", T = w === "auto" && e && e !== 1 || w === !0;
  if (S && (_ !== Ir || f !== Ir)) {
    var O = parseFloat(f) * pi, v = Math.sin(O), P = Math.cos(O), C;
    O = parseFloat(_) * pi, C = Math.cos(O), s = cs(b, s, v * C * -S), o = cs(b, o, -Math.sin(O) * -S), u = cs(b, u, P * C * -S + S);
  }
  m !== Di && (x += "perspective(" + m + Br), (i || n) && (x += "translate(" + i + "%, " + n + "%) "), (T || s !== Di || o !== Di || u !== Di) && (x += u !== Di || T ? "translate3d(" + s + ", " + o + ", " + u + ") " : "translate(" + s + ", " + o + Br), l !== Ir && (x += "rotate(" + l + Br), f !== Ir && (x += "rotateY(" + f + Br), _ !== Ir && (x += "rotateX(" + _ + Br), (d !== Ir || c !== Ir) && (x += "skew(" + d + ", " + c + Br), (p !== 1 || h !== 1) && (x += "scale(" + p + ", " + h + Br), b.style[ce] = x || "translate(0, 0)";
}, Bl = function(e, r) {
  var t = r || this, i = t.xPercent, n = t.yPercent, s = t.x, o = t.y, u = t.rotation, l = t.skewX, f = t.skewY, _ = t.scaleX, d = t.scaleY, c = t.target, p = t.xOrigin, h = t.yOrigin, m = t.xOffset, w = t.yOffset, b = t.forceCSS, S = parseFloat(s), x = parseFloat(o), T, O, v, P, C;
  u = parseFloat(u), l = parseFloat(l), f = parseFloat(f), f && (f = parseFloat(f), l += f, u += f), u || l ? (u *= pi, l *= pi, T = Math.cos(u) * _, O = Math.sin(u) * _, v = Math.sin(u - l) * -d, P = Math.cos(u - l) * d, l && (f *= pi, C = Math.tan(l - f), C = Math.sqrt(1 + C * C), v *= C, P *= C, f && (C = Math.tan(f), C = Math.sqrt(1 + C * C), T *= C, O *= C)), T = xe(T), O = xe(O), v = xe(v), P = xe(P)) : (T = _, P = d, O = v = 0), (S && !~(s + "").indexOf("px") || x && !~(o + "").indexOf("px")) && (S = Mr(c, "x", s, "px"), x = Mr(c, "y", o, "px")), (p || h || m || w) && (S = xe(S + p - (p * T + h * v) + m), x = xe(x + h - (p * O + h * P) + w)), (i || n) && (C = c.getBBox(), S = xe(S + i / 100 * C.width), x = xe(x + n / 100 * C.height)), C = "matrix(" + T + "," + O + "," + v + "," + P + "," + S + "," + x + ")", c.setAttribute("transform", C), b && (c.style[ce] = C);
}, Nl = function(e, r, t, i, n) {
  var s = 360, o = Re(n), u = parseFloat(n) * (o && ~n.indexOf("rad") ? Nr : 1), l = u - i, f = i + l + "deg", _, d;
  return o && (_ = n.split("_")[1], _ === "short" && (l %= s, l !== l % (s / 2) && (l += l < 0 ? s : -s)), _ === "cw" && l < 0 ? l = (l + s * Co) % s - ~~(l / s) * s : _ === "ccw" && l > 0 && (l = (l - s * Co) % s - ~~(l / s) * s)), e._pt = d = new ft(e._pt, r, t, i, l, bl), d.e = f, d.u = "deg", e._props.push(t), d;
}, Ao = function(e, r) {
  for (var t in r)
    e[t] = r[t];
  return e;
}, Yl = function(e, r, t) {
  var i = Ao({}, t._gsap), n = "perspective,force3D,transformOrigin,svgOrigin", s = t.style, o, u, l, f, _, d, c, p;
  i.svg ? (l = t.getAttribute("transform"), t.setAttribute("transform", ""), s[ce] = r, o = on(t, 1), Or(t, ce), t.setAttribute("transform", l)) : (l = getComputedStyle(t)[ce], s[ce] = r, o = on(t, 1), s[ce] = l);
  for (u in lr)
    l = i[u], f = o[u], l !== f && n.indexOf(u) < 0 && (c = $e(l), p = $e(f), _ = c !== p ? Mr(t, u, l, p) : parseFloat(l), d = parseFloat(f), e._pt = new ft(e._pt, o, u, _, d - _, Cs), e._pt.u = p || 0, e._props.push(u));
  Ao(o, i);
};
lt("padding,margin,Width,Radius", function(a, e) {
  var r = "Top", t = "Right", i = "Bottom", n = "Left", s = (e < 3 ? [r, t, i, n] : [r + n, r + t, i + t, i + n]).map(function(o) {
    return e < 2 ? a + o : "border" + o + a;
  });
  Gn[e > 1 ? "border" + a : a] = function(o, u, l, f, _) {
    var d, c;
    if (arguments.length < 4)
      return d = s.map(function(p) {
        return ir(o, p, l);
      }), c = d.join(" "), c.split(d[0]).length === 5 ? d[0] : c;
    d = (f + "").split(" "), c = {}, s.forEach(function(p, h) {
      return c[p] = d[h] = d[h] || d[(h - 1) / 2 | 0];
    }), o.init(u, c, _);
  };
});
var Ga = {
  name: "css",
  register: Os,
  targetTest: function(e) {
    return e.style && e.nodeType;
  },
  init: function(e, r, t, i, n) {
    var s = this._props, o = e.style, u = t.vars.startAt, l, f, _, d, c, p, h, m, w, b, S, x, T, O, v, P, C;
    eo || Os(), this.styles = this.styles || Ya(e), P = this.styles.props, this.tween = t;
    for (h in r)
      if (h !== "autoRound" && (f = r[h], !(yt[h] && Da(h, r, t, i, e, n)))) {
        if (c = typeof f, p = Gn[h], c === "function" && (f = f.call(t, i, e, n), c = typeof f), c === "string" && ~f.indexOf("random(") && (f = en(f)), p)
          p(this, e, h, f, t) && (v = 1);
        else if (h.substr(0, 2) === "--")
          l = (getComputedStyle(e).getPropertyValue(h) + "").trim(), f += "", Sr.lastIndex = 0, Sr.test(l) || (m = $e(l), w = $e(f), w ? m !== w && (l = Mr(e, h, l, w) + w) : m && (f += m)), this.add(o, "setProperty", l, f, i, n, 0, 0, h), s.push(h), P.push(h, 0, o[h]);
        else if (c !== "undefined") {
          if (u && h in u ? (l = typeof u[h] == "function" ? u[h].call(t, i, e, n) : u[h], Re(l) && ~l.indexOf("random(") && (l = en(l)), $e(l + "") || l === "auto" || (l += Tt.units[h] || $e(ir(e, h)) || ""), (l + "").charAt(1) === "=" && (l = ir(e, h))) : l = ir(e, h), d = parseFloat(l), b = c === "string" && f.charAt(1) === "=" && f.substr(0, 2), b && (f = f.substr(2)), _ = parseFloat(f), h in Gt && (h === "autoAlpha" && (d === 1 && ir(e, "visibility") === "hidden" && _ && (d = 0), P.push("visibility", 0, o.visibility), vr(this, o, "visibility", d ? "inherit" : "hidden", _ ? "inherit" : "hidden", !_)), h !== "scale" && h !== "transform" && (h = Gt[h], ~h.indexOf(",") && (h = h.split(",")[0]))), S = h in lr, S) {
            if (this.styles.save(h), C = f, c === "string" && f.substring(0, 6) === "var(--") {
              if (f = wt(e, f.substring(4, f.indexOf(")"))), f.substring(0, 5) === "calc(") {
                var k = e.style.perspective;
                e.style.perspective = f, f = wt(e, "perspective"), k ? e.style.perspective = k : Or(e, "perspective");
              }
              _ = parseFloat(f);
            }
            if (x || (T = e._gsap, T.renderTransform && !r.parseTransform || on(e, r.parseTransform), O = r.smoothOrigin !== !1 && T.smooth, x = this._pt = new ft(this._pt, o, ce, 0, 1, T.renderTransform, T, 0, -1), x.dep = 1), h === "scale")
              this._pt = new ft(this._pt, T, "scaleY", T.scaleY, (b ? _i(T.scaleY, b + _) : _) - T.scaleY || 0, Cs), this._pt.u = 0, s.push("scaleY", h), h += "X";
            else if (h === "transformOrigin") {
              P.push(ct, 0, o[ct]), f = Fl(f), T.svg ? Ms(e, f, 0, O, 0, this) : (w = parseFloat(f.split(" ")[2]) || 0, w !== T.zOrigin && vr(this, T, "zOrigin", T.zOrigin, w), vr(this, o, h, Hn(l), Hn(f)));
              continue;
            } else if (h === "svgOrigin") {
              Ms(e, f, 1, O, 0, this);
              continue;
            } else if (h in Ua) {
              Nl(this, T, h, d, b ? _i(d, b + f) : f);
              continue;
            } else if (h === "smoothOrigin") {
              vr(this, T, "smooth", T.smooth, f);
              continue;
            } else if (h === "force3D") {
              T[h] = f;
              continue;
            } else if (h === "transform") {
              Yl(this, f, e);
              continue;
            }
          } else h in o || (h = Si(h) || h);
          if (S || (_ || _ === 0) && (d || d === 0) && !xl.test(f) && h in o)
            m = (l + "").substr((d + "").length), _ || (_ = 0), w = $e(f) || (h in Tt.units ? Tt.units[h] : m), m !== w && (d = Mr(e, h, l, w)), this._pt = new ft(this._pt, S ? T : o, h, d, (b ? _i(d, b + _) : _) - d, !S && (w === "px" || h === "zIndex") && r.autoRound !== !1 ? Sl : Cs), this._pt.u = w || 0, S && C !== f ? (this._pt.b = l, this._pt.e = C, this._pt.r = Tl) : m !== w && w !== "%" && (this._pt.b = l, this._pt.r = wl);
          else if (h in o)
            zl.call(this, e, h, l, b ? b + f : f);
          else if (h in e)
            this.add(e, h, l || e[h], b ? b + f : f, i, n);
          else if (h !== "parseTransform") {
            Us(h, f);
            continue;
          }
          S || (h in o ? P.push(h, 0, o[h]) : typeof e[h] == "function" ? P.push(h, 2, e[h]()) : P.push(h, 1, l || e[h])), s.push(h);
        }
      }
    v && Fa(this);
  },
  render: function(e, r) {
    if (r.tween._time || !to())
      for (var t = r._pt; t; )
        t.r(e, t.d), t = t._next;
    else
      r.styles.revert();
  },
  get: ir,
  aliases: Gt,
  getSetter: function(e, r, t) {
    var i = Gt[r];
    return i && i.indexOf(",") < 0 && (r = i), r in lr && r !== ct && (e._gsap.x || ir(e, "x")) ? t && ko === t ? r === "scale" ? Ol : Pl : (ko = t || {}) && (r === "scale" ? Ml : Dl) : e.style && !Xs(e.style[r]) ? kl : ~r.indexOf("-") ? Cl : js(e, r);
  },
  core: {
    _removeProperty: Or,
    _getMatrix: io
  }
};
ht.utils.checkPrefix = Si;
ht.core.getStyleSaver = Ya;
(function(a, e, r, t) {
  var i = lt(a + "," + e + "," + r, function(n) {
    lr[n] = 1;
  });
  lt(e, function(n) {
    Tt.units[n] = "deg", Ua[n] = 1;
  }), Gt[i[13]] = a + "," + e, lt(t, function(n) {
    var s = n.split(":");
    Gt[s[1]] = i[s[0]];
  });
})("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY");
lt("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function(a) {
  Tt.units[a] = "px";
});
ht.registerPlugin(Ga);
var sr = ht.registerPlugin(Ga) || ht;
sr.core.Tween;
function Xl(a, e) {
  for (var r = 0; r < e.length; r++) {
    var t = e[r];
    t.enumerable = t.enumerable || !1, t.configurable = !0, "value" in t && (t.writable = !0), Object.defineProperty(a, t.key, t);
  }
}
function ql(a, e, r) {
  return e && Xl(a.prototype, e), a;
}
var Le, An, at, xr, br, gi, Ha, Yr, mi, Ka, or, Nt, Qa, Za = function() {
  return Le || typeof window < "u" && (Le = window.gsap) && Le.registerPlugin && Le;
}, ja = 1, hi = [], q = [], Kt = [], Vi = Date.now, Ds = function(e, r) {
  return r;
}, Vl = function() {
  var e = mi.core, r = e.bridge || {}, t = e._scrollers, i = e._proxies;
  t.push.apply(t, q), i.push.apply(i, Kt), q = t, Kt = i, Ds = function(s, o) {
    return r[s](o);
  };
}, kr = function(e, r) {
  return ~Kt.indexOf(e) && Kt[Kt.indexOf(e) + 1][r];
}, Ui = function(e) {
  return !!~Ka.indexOf(e);
}, Je = function(e, r, t, i, n) {
  return e.addEventListener(r, t, {
    passive: i !== !1,
    capture: !!n
  });
}, je = function(e, r, t, i) {
  return e.removeEventListener(r, t, !!i);
}, mn = "scrollLeft", yn = "scrollTop", Es = function() {
  return or && or.isPressed || q.cache++;
}, Kn = function(e, r) {
  var t = function i(n) {
    if (n || n === 0) {
      ja && at.history.scrollRestoration !== "manual" && (at.history.scrollRestoration = "manual");
      var s = or && or.isPressed;
      n = i.v = Math.round(n) || (or && or.iOS ? 1 : 0), e(n), i.cacheID = q.cache, s && Ds("ss", n);
    } else (r || q.cache !== i.cacheID || Ds("ref")) && (i.cacheID = q.cache, i.v = e());
    return i.v + i.offset;
  };
  return t.offset = 0, e && t;
}, it = {
  s: mn,
  p: "left",
  p2: "Left",
  os: "right",
  os2: "Right",
  d: "width",
  d2: "Width",
  a: "x",
  sc: Kn(function(a) {
    return arguments.length ? at.scrollTo(a, Pe.sc()) : at.pageXOffset || xr[mn] || br[mn] || gi[mn] || 0;
  })
}, Pe = {
  s: yn,
  p: "top",
  p2: "Top",
  os: "bottom",
  os2: "Bottom",
  d: "height",
  d2: "Height",
  a: "y",
  op: it,
  sc: Kn(function(a) {
    return arguments.length ? at.scrollTo(it.sc(), a) : at.pageYOffset || xr[yn] || br[yn] || gi[yn] || 0;
  })
}, st = function(e, r) {
  return (r && r._ctx && r._ctx.selector || Le.utils.toArray)(e)[0] || (typeof e == "string" && Le.config().nullTargetWarn !== !1 ? console.warn("Element not found:", e) : null);
}, Ul = function(e, r) {
  for (var t = r.length; t--; )
    if (r[t] === e || r[t].contains(e))
      return !0;
  return !1;
}, Dr = function(e, r) {
  var t = r.s, i = r.sc;
  Ui(e) && (e = xr.scrollingElement || br);
  var n = q.indexOf(e), s = i === Pe.sc ? 1 : 2;
  !~n && (n = q.push(e) - 1), q[n + s] || Je(e, "scroll", Es);
  var o = q[n + s], u = o || (q[n + s] = Kn(kr(e, t), !0) || (Ui(e) ? i : Kn(function(l) {
    return arguments.length ? e[t] = l : e[t];
  })));
  return u.target = e, o || (u.smooth = Le.getProperty(e, "scrollBehavior") === "smooth"), u;
}, Rs = function(e, r, t) {
  var i = e, n = e, s = Vi(), o = s, u = r || 50, l = Math.max(500, u * 3), f = function(p, h) {
    var m = Vi();
    h || m - s > u ? (n = i, i = p, o = s, s = m) : t ? i += p : i = n + (p - n) / (m - o) * (s - o);
  }, _ = function() {
    n = i = t ? 0 : i, o = s = 0;
  }, d = function(p) {
    var h = o, m = n, w = Vi();
    return (p || p === 0) && p !== i && f(p), s === o || w - o > l ? 0 : (i + (t ? m : -m)) / ((t ? w : s) - h) * 1e3;
  };
  return {
    update: f,
    reset: _,
    getVelocity: d
  };
}, Ei = function(e, r) {
  return r && !e._gsapAllow && e.cancelable !== !1 && e.preventDefault(), e.changedTouches ? e.changedTouches[0] : e;
}, zo = function(e) {
  var r = Math.max.apply(Math, e), t = Math.min.apply(Math, e);
  return Math.abs(r) >= Math.abs(t) ? r : t;
}, Ja = function() {
  mi = Le.core.globals().ScrollTrigger, mi && mi.core && Vl();
}, eu = function(e) {
  return Le = e || Za(), !An && Le && typeof document < "u" && document.body && (at = window, xr = document, br = xr.documentElement, gi = xr.body, Ka = [at, xr, br, gi], Le.utils.clamp, Qa = Le.core.context || function() {
  }, Yr = "onpointerenter" in gi ? "pointer" : "mouse", Ha = be.isTouch = at.matchMedia && at.matchMedia("(hover: none), (pointer: coarse)").matches ? 1 : "ontouchstart" in at || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 ? 2 : 0, Nt = be.eventTypes = ("ontouchstart" in br ? "touchstart,touchmove,touchcancel,touchend" : "onpointerdown" in br ? "pointerdown,pointermove,pointercancel,pointerup" : "mousedown,mousemove,mouseup,mouseup").split(","), setTimeout(function() {
    return ja = 0;
  }, 500), An = 1), mi || Ja(), An;
};
it.op = Pe;
q.cache = 0;
var be = /* @__PURE__ */ (function() {
  function a(r) {
    this.init(r);
  }
  var e = a.prototype;
  return e.init = function(t) {
    An || eu(Le) || console.warn("Please gsap.registerPlugin(Observer)"), mi || Ja();
    var i = t.tolerance, n = t.dragMinimum, s = t.type, o = t.target, u = t.lineHeight, l = t.debounce, f = t.preventDefault, _ = t.onStop, d = t.onStopDelay, c = t.ignore, p = t.wheelSpeed, h = t.event, m = t.onDragStart, w = t.onDragEnd, b = t.onDrag, S = t.onPress, x = t.onRelease, T = t.onRight, O = t.onLeft, v = t.onUp, P = t.onDown, C = t.onChangeX, k = t.onChangeY, N = t.onChange, D = t.onToggleX, H = t.onToggleY, I = t.onHover, K = t.onHoverEnd, W = t.onMove, A = t.ignoreCheck, Q = t.isNormalizer, re = t.onGestureStart, g = t.onGestureEnd, se = t.onWheel, Ke = t.onEnable, At = t.onDisable, he = t.onClick, Ae = t.scrollSpeed, Be = t.capture, _e = t.allowClicks, Qe = t.lockAxis, Ne = t.onLockAxis;
    this.target = o = st(o) || br, this.vars = t, c && (c = Le.utils.toArray(c)), i = i || 1e-9, n = n || 0, p = p || 1, Ae = Ae || 1, s = s || "wheel,touch,pointer", l = l !== !1, u || (u = parseFloat(at.getComputedStyle(gi).lineHeight) || 22);
    var fr, Ye, Ze, Z, me, nt, _t, y = this, dt = 0, Zt = 0, cr = t.passive || !f && t.passive !== !1, de = Dr(o, it), jt = Dr(o, Pe), hr = de(), Rr = jt(), Oe = ~s.indexOf("touch") && !~s.indexOf("pointer") && Nt[0] === "pointerdown", _r = Ui(o), ye = o.ownerDocument || xr, zt = [0, 0, 0], Ct = [0, 0, 0], Jt = 0, Ci = function() {
      return Jt = Vi();
    }, we = function(z, j) {
      return (y.event = z) && c && Ul(z.target, c) || j && Oe && z.pointerType !== "touch" || A && A(z, j);
    }, _n = function() {
      y._vx.reset(), y._vy.reset(), Ye.pause(), _ && _(y);
    }, er = function() {
      var z = y.deltaX = zo(zt), j = y.deltaY = zo(Ct), M = Math.abs(z) >= i, F = Math.abs(j) >= i;
      N && (M || F) && N(y, z, j, zt, Ct), M && (T && y.deltaX > 0 && T(y), O && y.deltaX < 0 && O(y), C && C(y), D && y.deltaX < 0 != dt < 0 && D(y), dt = y.deltaX, zt[0] = zt[1] = zt[2] = 0), F && (P && y.deltaY > 0 && P(y), v && y.deltaY < 0 && v(y), k && k(y), H && y.deltaY < 0 != Zt < 0 && H(y), Zt = y.deltaY, Ct[0] = Ct[1] = Ct[2] = 0), (Z || Ze) && (W && W(y), Ze && (m && Ze === 1 && m(y), b && b(y), Ze = 0), Z = !1), nt && !(nt = !1) && Ne && Ne(y), me && (se(y), me = !1), fr = 0;
    }, ti = function(z, j, M) {
      zt[M] += z, Ct[M] += j, y._vx.update(z), y._vy.update(j), l ? fr || (fr = requestAnimationFrame(er)) : er();
    }, ri = function(z, j) {
      Qe && !_t && (y.axis = _t = Math.abs(z) > Math.abs(j) ? "x" : "y", nt = !0), _t !== "y" && (zt[2] += z, y._vx.update(z, !0)), _t !== "x" && (Ct[2] += j, y._vy.update(j, !0)), l ? fr || (fr = requestAnimationFrame(er)) : er();
    }, dr = function(z) {
      if (!we(z, 1)) {
        z = Ei(z, f);
        var j = z.clientX, M = z.clientY, F = j - y.x, R = M - y.y, L = y.isDragging;
        y.x = j, y.y = M, (L || (F || R) && (Math.abs(y.startX - j) >= n || Math.abs(y.startY - M) >= n)) && (Ze || (Ze = L ? 2 : 1), L || (y.isDragging = !0), ri(F, R));
      }
    }, Ar = y.onPress = function(B) {
      we(B, 1) || B && B.button || (y.axis = _t = null, Ye.pause(), y.isPressed = !0, B = Ei(B), dt = Zt = 0, y.startX = y.x = B.clientX, y.startY = y.y = B.clientY, y._vx.reset(), y._vy.reset(), Je(Q ? o : ye, Nt[1], dr, cr, !0), y.deltaX = y.deltaY = 0, S && S(y));
    }, U = y.onRelease = function(B) {
      if (!we(B, 1)) {
        je(Q ? o : ye, Nt[1], dr, !0);
        var z = !isNaN(y.y - y.startY), j = y.isDragging, M = j && (Math.abs(y.x - y.startX) > 3 || Math.abs(y.y - y.startY) > 3), F = Ei(B);
        !M && z && (y._vx.reset(), y._vy.reset(), f && _e && Le.delayedCall(0.08, function() {
          if (Vi() - Jt > 300 && !B.defaultPrevented) {
            if (B.target.click)
              B.target.click();
            else if (ye.createEvent) {
              var R = ye.createEvent("MouseEvents");
              R.initMouseEvent("click", !0, !0, at, 1, F.screenX, F.screenY, F.clientX, F.clientY, !1, !1, !1, !1, 0, null), B.target.dispatchEvent(R);
            }
          }
        })), y.isDragging = y.isGesturing = y.isPressed = !1, _ && j && !Q && Ye.restart(!0), Ze && er(), w && j && w(y), x && x(y, M);
      }
    }, zr = function(z) {
      return z.touches && z.touches.length > 1 && (y.isGesturing = !0) && re(z, y.isDragging);
    }, Ft = function() {
      return (y.isGesturing = !1) || g(y);
    }, Lt = function(z) {
      if (!we(z)) {
        var j = de(), M = jt();
        ti((j - hr) * Ae, (M - Rr) * Ae, 1), hr = j, Rr = M, _ && Ye.restart(!0);
      }
    }, It = function(z) {
      if (!we(z)) {
        z = Ei(z, f), se && (me = !0);
        var j = (z.deltaMode === 1 ? u : z.deltaMode === 2 ? at.innerHeight : 1) * p;
        ti(z.deltaX * j, z.deltaY * j, 0), _ && !Q && Ye.restart(!0);
      }
    }, Fr = function(z) {
      if (!we(z)) {
        var j = z.clientX, M = z.clientY, F = j - y.x, R = M - y.y;
        y.x = j, y.y = M, Z = !0, _ && Ye.restart(!0), (F || R) && ri(F, R);
      }
    }, ii = function(z) {
      y.event = z, I(y);
    }, tr = function(z) {
      y.event = z, K(y);
    }, Pi = function(z) {
      return we(z) || Ei(z, f) && he(y);
    };
    Ye = y._dc = Le.delayedCall(d || 0.25, _n).pause(), y.deltaX = y.deltaY = 0, y._vx = Rs(0, 50, !0), y._vy = Rs(0, 50, !0), y.scrollX = de, y.scrollY = jt, y.isDragging = y.isGesturing = y.isPressed = !1, Qa(this), y.enable = function(B) {
      return y.isEnabled || (Je(_r ? ye : o, "scroll", Es), s.indexOf("scroll") >= 0 && Je(_r ? ye : o, "scroll", Lt, cr, Be), s.indexOf("wheel") >= 0 && Je(o, "wheel", It, cr, Be), (s.indexOf("touch") >= 0 && Ha || s.indexOf("pointer") >= 0) && (Je(o, Nt[0], Ar, cr, Be), Je(ye, Nt[2], U), Je(ye, Nt[3], U), _e && Je(o, "click", Ci, !0, !0), he && Je(o, "click", Pi), re && Je(ye, "gesturestart", zr), g && Je(ye, "gestureend", Ft), I && Je(o, Yr + "enter", ii), K && Je(o, Yr + "leave", tr), W && Je(o, Yr + "move", Fr)), y.isEnabled = !0, y.isDragging = y.isGesturing = y.isPressed = Z = Ze = !1, y._vx.reset(), y._vy.reset(), hr = de(), Rr = jt(), B && B.type && Ar(B), Ke && Ke(y)), y;
    }, y.disable = function() {
      y.isEnabled && (hi.filter(function(B) {
        return B !== y && Ui(B.target);
      }).length || je(_r ? ye : o, "scroll", Es), y.isPressed && (y._vx.reset(), y._vy.reset(), je(Q ? o : ye, Nt[1], dr, !0)), je(_r ? ye : o, "scroll", Lt, Be), je(o, "wheel", It, Be), je(o, Nt[0], Ar, Be), je(ye, Nt[2], U), je(ye, Nt[3], U), je(o, "click", Ci, !0), je(o, "click", Pi), je(ye, "gesturestart", zr), je(ye, "gestureend", Ft), je(o, Yr + "enter", ii), je(o, Yr + "leave", tr), je(o, Yr + "move", Fr), y.isEnabled = y.isPressed = y.isDragging = !1, At && At(y));
    }, y.kill = y.revert = function() {
      y.disable();
      var B = hi.indexOf(y);
      B >= 0 && hi.splice(B, 1), or === y && (or = 0);
    }, hi.push(y), Q && Ui(o) && (or = y), y.enable(h);
  }, ql(a, [{
    key: "velocityX",
    get: function() {
      return this._vx.getVelocity();
    }
  }, {
    key: "velocityY",
    get: function() {
      return this._vy.getVelocity();
    }
  }]), a;
})();
be.version = "3.15.1";
be.create = function(a) {
  return new be(a);
};
be.register = eu;
be.getAll = function() {
  return hi.slice();
};
be.getById = function(a) {
  return hi.filter(function(e) {
    return e.vars.id === a;
  })[0];
};
Za() && Le.registerPlugin(be);
var E, ui, X, ee, vt, J, no, Qn, an, Wi, Fi, vn, Ue, rs, As, tt, Fo, Lo, li, tu, hs, ru, et, zs, iu, nu, gr, Fs, so, yi, oo, Cr, Ls, _s, xn = 1, We = Date.now, ds = We(), Rt = 0, Li = 0, Io = function(e, r, t) {
  var i = mt(e) && (e.substr(0, 6) === "clamp(" || e.indexOf("max") > -1);
  return t["_" + r + "Clamp"] = i, i ? e.substr(6, e.length - 7) : e;
}, Bo = function(e, r) {
  return r && (!mt(e) || e.substr(0, 6) !== "clamp(") ? "clamp(" + e + ")" : e;
}, Wl = function a() {
  return Li && requestAnimationFrame(a);
}, No = function() {
  return rs = 1;
}, Yo = function() {
  return rs = 0;
}, Wt = function(e) {
  return e;
}, Ii = function(e) {
  return Math.round(e * 1e5) / 1e5 || 0;
}, su = function() {
  return typeof window < "u";
}, ou = function() {
  return E || su() && (E = window.gsap) && E.registerPlugin && E;
}, Zr = function(e) {
  return !!~no.indexOf(e);
}, au = function(e) {
  return (e === "Height" ? oo : X["inner" + e]) || vt["client" + e] || J["client" + e];
}, uu = function(e) {
  return kr(e, "getBoundingClientRect") || (Zr(e) ? function() {
    return Bn.width = X.innerWidth, Bn.height = oo, Bn;
  } : function() {
    return nr(e);
  });
}, $l = function(e, r, t) {
  var i = t.d, n = t.d2, s = t.a;
  return (s = kr(e, "getBoundingClientRect")) ? function() {
    return s()[i];
  } : function() {
    return (r ? au(n) : e["client" + n]) || 0;
  };
}, Gl = function(e, r) {
  return !r || ~Kt.indexOf(e) ? uu(e) : function() {
    return Bn;
  };
}, Ht = function(e, r) {
  var t = r.s, i = r.d2, n = r.d, s = r.a;
  return Math.max(0, (t = "scroll" + i) && (s = kr(e, t)) ? s() - uu(e)()[n] : Zr(e) ? (vt[t] || J[t]) - au(i) : e[t] - e["offset" + i]);
}, bn = function(e, r) {
  for (var t = 0; t < li.length; t += 3)
    (!r || ~r.indexOf(li[t + 1])) && e(li[t], li[t + 1], li[t + 2]);
}, mt = function(e) {
  return typeof e == "string";
}, Ge = function(e) {
  return typeof e == "function";
}, Bi = function(e) {
  return typeof e == "number";
}, Xr = function(e) {
  return typeof e == "object";
}, Ri = function(e, r, t) {
  return e && e.progress(r ? 0 : 1) && t && e.pause();
}, si = function(e, r, t) {
  if (e.enabled) {
    var i = e._ctx ? e._ctx.add(function() {
      return r(e, t);
    }) : r(e, t);
    i && i.totalTime && (e.callbackAnimation = i);
  }
}, oi = Math.abs, lu = "left", fu = "top", ao = "right", uo = "bottom", Hr = "width", Kr = "height", $i = "Right", Gi = "Left", Hi = "Top", Ki = "Bottom", Te = "padding", Ot = "margin", ki = "Width", lo = "Height", Ce = "px", Mt = function(e) {
  return X.getComputedStyle(e.nodeType === Node.DOCUMENT_NODE ? e.scrollingElement : e);
}, Hl = function(e) {
  var r = Mt(e).position;
  e.style.position = r === "absolute" || r === "fixed" ? r : "relative";
}, Xo = function(e, r) {
  for (var t in r)
    t in e || (e[t] = r[t]);
  return e;
}, nr = function(e, r) {
  var t = r && Mt(e)[As] !== "matrix(1, 0, 0, 1, 0, 0)" && E.to(e, {
    x: 0,
    y: 0,
    xPercent: 0,
    yPercent: 0,
    rotation: 0,
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    skewX: 0,
    skewY: 0
  }).progress(1), i = e.getBoundingClientRect ? e.getBoundingClientRect() : e.scrollingElement.getBoundingClientRect();
  return t && t.progress(0).kill(), i;
}, Zn = function(e, r) {
  var t = r.d2;
  return e["offset" + t] || e["client" + t] || 0;
}, cu = function(e) {
  var r = [], t = e.labels, i = e.duration(), n;
  for (n in t)
    r.push(t[n] / i);
  return r;
}, Kl = function(e) {
  return function(r) {
    return E.utils.snap(cu(e), r);
  };
}, fo = function(e) {
  var r = E.utils.snap(e), t = Array.isArray(e) && e.slice(0).sort(function(i, n) {
    return i - n;
  });
  return t ? function(i, n, s) {
    s === void 0 && (s = 1e-3);
    var o;
    if (!n)
      return r(i);
    if (n > 0) {
      for (i -= s, o = 0; o < t.length; o++)
        if (t[o] >= i)
          return t[o];
      return t[o - 1];
    } else
      for (o = t.length, i += s; o--; )
        if (t[o] <= i)
          return t[o];
    return t[0];
  } : function(i, n, s) {
    s === void 0 && (s = 1e-3);
    var o = r(i);
    return !n || Math.abs(o - i) < s || o - i < 0 == n < 0 ? o : r(n < 0 ? i - e : i + e);
  };
}, Ql = function(e) {
  return function(r, t) {
    return fo(cu(e))(r, t.direction);
  };
}, wn = function(e, r, t, i) {
  return t.split(",").forEach(function(n) {
    return e(r, n, i);
  });
}, Ee = function(e, r, t, i, n) {
  return e.addEventListener(r, t, {
    passive: !i,
    capture: !!n
  });
}, De = function(e, r, t, i) {
  return e.removeEventListener(r, t, !!i);
}, Tn = function(e, r, t) {
  t = t && t.wheelHandler, t && (e(r, "wheel", t), e(r, "touchmove", t));
}, qo = {
  startColor: "green",
  endColor: "red",
  indent: 0,
  fontSize: "16px",
  fontWeight: "normal"
}, Sn = {
  toggleActions: "play",
  anticipatePin: 0
}, jn = {
  top: 0,
  left: 0,
  center: 0.5,
  bottom: 1,
  right: 1
}, zn = function(e, r) {
  if (mt(e)) {
    var t = e.indexOf("="), i = ~t ? +(e.charAt(t - 1) + 1) * parseFloat(e.substr(t + 1)) : 0;
    ~t && (e.indexOf("%") > t && (i *= r / 100), e = e.substr(0, t - 1)), e = i + (e in jn ? jn[e] * r : ~e.indexOf("%") ? parseFloat(e) * r / 100 : parseFloat(e) || 0);
  }
  return e;
}, kn = function(e, r, t, i, n, s, o, u) {
  var l = n.startColor, f = n.endColor, _ = n.fontSize, d = n.indent, c = n.fontWeight, p = ee.createElement("div"), h = Zr(t) || kr(t, "pinType") === "fixed", m = e.indexOf("scroller") !== -1, w = h ? J : t.tagName === "IFRAME" ? t.contentDocument.body : t, b = e.indexOf("start") !== -1, S = b ? l : f, x = "border-color:" + S + ";font-size:" + _ + ";color:" + S + ";font-weight:" + c + ";pointer-events:none;white-space:nowrap;font-family:sans-serif,Arial;z-index:1000;padding:4px 8px;border-width:0;border-style:solid;";
  return x += "position:" + ((m || u) && h ? "fixed;" : "absolute;"), (m || u || !h) && (x += (i === Pe ? ao : uo) + ":" + (s + parseFloat(d)) + "px;"), o && (x += "box-sizing:border-box;text-align:left;width:" + o.offsetWidth + "px;"), p._isStart = b, p.setAttribute("class", "gsap-marker-" + e + (r ? " marker-" + r : "")), p.style.cssText = x, p.innerText = r || r === 0 ? e + "-" + r : e, w.children[0] ? w.insertBefore(p, w.children[0]) : w.appendChild(p), p._offset = p["offset" + i.op.d2], Fn(p, 0, i, b), p;
}, Fn = function(e, r, t, i) {
  var n = {
    display: "block"
  }, s = t[i ? "os2" : "p2"], o = t[i ? "p2" : "os2"];
  e._isFlipped = i, n[t.a + "Percent"] = i ? -100 : 0, n[t.a] = i ? "1px" : 0, n["border" + s + ki] = 1, n["border" + o + ki] = 0, n[t.p] = r + "px", E.set(e, n);
}, Y = [], Is = {}, un, Vo = function() {
  return We() - Rt > 34 && (un || (un = requestAnimationFrame(ar)));
}, ai = function() {
  (!et || !et.isPressed || et.startX > J.clientWidth) && (q.cache++, et ? un || (un = requestAnimationFrame(ar)) : ar(), Rt || Jr("scrollStart"), Rt = We());
}, ps = function() {
  nu = X.innerWidth, iu = X.innerHeight;
}, Ni = function(e) {
  q.cache++, (e === !0 || !Ue && !ru && !ee.fullscreenElement && !ee.webkitFullscreenElement && (!zs || nu !== X.innerWidth || Math.abs(X.innerHeight - iu) > X.innerHeight * 0.25)) && Qn.restart(!0);
}, jr = {}, Zl = [], hu = function a() {
  return De(V, "scrollEnd", a) || Vr(!0);
}, Jr = function(e) {
  return jr[e] && jr[e].map(function(r) {
    return r();
  }) || Zl;
}, gt = [], _u = function(e) {
  for (var r = 0; r < gt.length; r += 5)
    (!e || gt[r + 4] && gt[r + 4].query === e) && (gt[r].style.cssText = gt[r + 1], gt[r].getBBox && gt[r].setAttribute("transform", gt[r + 2] || ""), gt[r + 3].uncache = 1);
}, du = function() {
  q.cache++, q.forEach(function(e) {
    return Ge(e) && (e.rec = e());
  });
}, co = function(e, r) {
  var t;
  for (tt = 0; tt < Y.length; tt++)
    t = Y[tt], t && (!r || t._ctx === r) && (e ? t.kill(1) : t.revert(!0, !0));
  Cr = !0, r && _u(r), r || Jr("revert");
}, pu = function(e, r) {
  q.cache++, (r || !rt) && q.forEach(function(t) {
    return Ge(t) && t.cacheID++ && (t.rec = 0);
  }), mt(e) && (so = e, X.history.scrollRestoration !== e && (X.history.scrollRestoration = e));
}, rt, Qr = 0, Uo, jl = function() {
  if (Uo !== Qr) {
    var e = Uo = Qr;
    requestAnimationFrame(function() {
      return e === Qr && Vr(!0);
    });
  }
}, gu = function() {
  J.appendChild(yi), oo = !et && yi.offsetHeight || X.innerHeight, J.removeChild(yi);
}, Wo = function(e) {
  return an(".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end").forEach(function(r) {
    return r.style.display = e ? "none" : "block";
  });
}, Vr = function(e, r) {
  if (vt = ee.documentElement, J = ee.body, no = [X, ee, vt, J], Rt && !e && !Cr) {
    Ee(V, "scrollEnd", hu);
    return;
  }
  gu(), rt = V.isRefreshing = !0, Cr || du();
  var t = Jr("refreshInit");
  tu && V.sort(), r || co(), q.forEach(function(i) {
    Ge(i) && (i.smooth && (i.target.style.scrollBehavior = "auto"), i(0));
  }), Y.slice(0).forEach(function(i) {
    return i.refresh();
  }), Cr = !1, Y.forEach(function(i) {
    if (i._subPinOffset && i.pin) {
      var n = i.vars.horizontal ? "offsetWidth" : "offsetHeight", s = i.pin[n];
      i.revert(!0, 1), i.adjustPinSpacing(i.pin[n] - s), i.refresh();
    }
  }), Ls = 1, Wo(!0), Y.forEach(function(i) {
    var n = Ht(i.scroller, i._dir), s = i.vars.end === "max" || i._endClamp && i.end > n, o = i._startClamp && i.start >= n;
    (s || o) && i.setPositions(o ? n - 1 : i.start, s ? Math.max(o ? n : i.start + 1, n) : i.end, !0);
  }), Wo(!1), Ls = 0, t.forEach(function(i) {
    return i && i.render && i.render(-1);
  }), q.forEach(function(i) {
    Ge(i) && (i.smooth && requestAnimationFrame(function() {
      return i.target.style.scrollBehavior = "smooth";
    }), i.rec && i(i.rec));
  }), pu(so, 1), Qn.pause(), Qr++, rt = 2, ar(2), Y.forEach(function(i) {
    return Ge(i.vars.onRefresh) && i.vars.onRefresh(i);
  }), rt = V.isRefreshing = !1, Jr("refresh");
}, Bs = 0, Ln = 1, Qi, ar = function(e) {
  if (e === 2 || !rt && !Cr) {
    V.isUpdating = !0, Qi && Qi.update(0);
    var r = Y.length, t = We(), i = t - ds >= 50, n = r && Y[0].scroll();
    if (Ln = Bs > n ? -1 : 1, rt || (Bs = n), i && (Rt && !rs && t - Rt > 200 && (Rt = 0, Jr("scrollEnd")), Fi = ds, ds = t), Ln < 0) {
      for (tt = r; tt-- > 0; )
        Y[tt] && Y[tt].update(0, i);
      Ln = 1;
    } else
      for (tt = 0; tt < r; tt++)
        Y[tt] && Y[tt].update(0, i);
    V.isUpdating = !1;
  }
  un = 0;
}, Ns = [lu, fu, uo, ao, Ot + Ki, Ot + $i, Ot + Hi, Ot + Gi, "display", "flexShrink", "float", "zIndex", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "gridArea", "justifySelf", "alignSelf", "placeSelf", "order"], In = Ns.concat([Hr, Kr, "boxSizing", "max" + ki, "max" + lo, "position", Ot, Te, Te + Hi, Te + $i, Te + Ki, Te + Gi]), Jl = function(e, r, t) {
  vi(t);
  var i = e._gsap;
  if (i.spacerIsNative)
    vi(i.spacerState);
  else if (e._gsap.swappedIn) {
    var n = r.parentNode;
    n && (n.insertBefore(e, r), n.removeChild(r));
  }
  e._gsap.swappedIn = !1;
}, gs = function(e, r, t, i) {
  if (!e._gsap.swappedIn) {
    for (var n = Ns.length, s = r.style, o = e.style, u; n--; )
      u = Ns[n], s[u] = t[u];
    s.position = t.position === "absolute" ? "absolute" : "relative", t.display === "inline" && (s.display = "inline-block"), o[uo] = o[ao] = "auto", s.flexBasis = t.flexBasis || "auto", s.overflow = "visible", s.boxSizing = "border-box", s[Hr] = Zn(e, it) + Ce, s[Kr] = Zn(e, Pe) + Ce, s[Te] = o[Ot] = o[fu] = o[lu] = "0", vi(i), o[Hr] = o["max" + ki] = t[Hr], o[Kr] = o["max" + lo] = t[Kr], o[Te] = t[Te], e.parentNode !== r && (e.parentNode.insertBefore(r, e), r.appendChild(e)), e._gsap.swappedIn = !0;
  }
}, ef = /([A-Z])/g, vi = function(e) {
  if (e) {
    var r = e.t.style, t = e.length, i = 0, n, s;
    for ((e.t._gsap || E.core.getCache(e.t)).uncache = 1; i < t; i += 2)
      s = e[i + 1], n = e[i], s ? r[n] = s : r[n] && r.removeProperty(n.replace(ef, "-$1").toLowerCase());
  }
}, Cn = function(e) {
  for (var r = In.length, t = e.style, i = [], n = 0; n < r; n++)
    i.push(In[n], t[In[n]]);
  return i.t = e, i;
}, tf = function(e, r, t) {
  for (var i = [], n = e.length, s = t ? 8 : 0, o; s < n; s += 2)
    o = e[s], i.push(o, o in r ? r[o] : e[s + 1]);
  return i.t = e.t, i;
}, Bn = {
  left: 0,
  top: 0
}, $o = function(e, r, t, i, n, s, o, u, l, f, _, d, c, p) {
  Ge(e) && (e = e(u)), mt(e) && e.substr(0, 3) === "max" && (e = d + (e.charAt(4) === "=" ? zn("0" + e.substr(3), t) : 0));
  var h = c ? c.time() : 0, m, w, b;
  if (c && c.seek(0), isNaN(e) || (e = +e), Bi(e))
    c && (e = E.utils.mapRange(c.scrollTrigger.start, c.scrollTrigger.end, 0, d, e)), o && Fn(o, t, i, !0);
  else {
    Ge(r) && (r = r(u));
    var S = (e || "0").split(" "), x, T, O, v;
    b = st(r, u) || J, x = nr(b) || {}, (!x || !x.left && !x.top) && Mt(b).display === "none" && (v = b.style.display, b.style.display = "block", x = nr(b), v ? b.style.display = v : b.style.removeProperty("display")), T = zn(S[0], x[i.d]), O = zn(S[1] || "0", t), e = x[i.p] - l[i.p] - f + T + n - O, o && Fn(o, O, i, t - O < 20 || o._isStart && O > 20), t -= t - O;
  }
  if (p && (u[p] = e || -1e-3, e < 0 && (e = 0)), s) {
    var P = e + t, C = s._isStart;
    m = "scroll" + i.d2, Fn(s, P, i, C && P > 20 || !C && (_ ? Math.max(J[m], vt[m]) : s.parentNode[m]) <= P + 1), _ && (l = nr(o), _ && (s.style[i.op.p] = l[i.op.p] - i.op.m - s._offset + Ce));
  }
  return c && b && (m = nr(b), c.seek(d), w = nr(b), c._caScrollDist = m[i.p] - w[i.p], e = e / c._caScrollDist * d), c && c.seek(h), c ? e : Math.round(e);
}, rf = /(webkit|moz|length|cssText|inset)/i, Go = function(e, r, t, i) {
  if (e.parentNode !== r) {
    var n = e.style, s, o;
    if (r === J) {
      e._stOrig = n.cssText, o = Mt(e);
      for (s in o)
        !+s && !rf.test(s) && o[s] && typeof n[s] == "string" && s !== "0" && (n[s] = o[s]);
      n.top = t, n.left = i;
    } else
      n.cssText = e._stOrig;
    E.core.getCache(e).uncache = 1, r.appendChild(e);
  }
}, mu = function(e, r, t) {
  var i = r, n = i;
  return function(s) {
    var o = Math.round(e());
    return o !== i && o !== n && Math.abs(o - i) > 3 && Math.abs(o - n) > 3 && (s = o, t && t()), n = i, i = Math.round(s), i;
  };
}, Pn = function(e, r, t) {
  var i = {};
  i[r.p] = "+=" + t, E.set(e, i);
}, Ho = function(e, r) {
  var t = Dr(e, r), i = "_scroll" + r.p2, n = function s(o, u, l, f, _) {
    var d = s.tween, c = u.onComplete, p = {};
    l = l || t();
    var h = mu(t, l, function() {
      d.kill(), s.tween = 0;
    });
    return _ = f && _ || 0, f = f || o - l, d && d.kill(), u[i] = o, u.inherit = !1, u.modifiers = p, p[i] = function() {
      return h(l + f * d.ratio + _ * d.ratio * d.ratio);
    }, u.onUpdate = function() {
      q.cache++, s.tween && ar();
    }, u.onComplete = function() {
      s.tween = 0, c && c.call(d);
    }, d = s.tween = E.to(e, u), d;
  };
  return e[i] = t, t.wheelHandler = function() {
    return n.tween && n.tween.kill() && (n.tween = 0);
  }, Ee(e, "wheel", t.wheelHandler), V.isTouch && Ee(e, "touchmove", t.wheelHandler), n;
}, V = /* @__PURE__ */ (function() {
  function a(r, t) {
    ui || a.register(E) || console.warn("Please gsap.registerPlugin(ScrollTrigger)"), Fs(this), this.init(r, t);
  }
  var e = a.prototype;
  return e.init = function(t, i) {
    if (this.progress = this.start = 0, this.vars && this.kill(!0, !0), !Li) {
      this.update = this.refresh = this.kill = Wt;
      return;
    }
    t = Xo(mt(t) || Bi(t) || t.nodeType ? {
      trigger: t
    } : t, Sn);
    var n = t, s = n.onUpdate, o = n.toggleClass, u = n.id, l = n.onToggle, f = n.onRefresh, _ = n.scrub, d = n.trigger, c = n.pin, p = n.pinSpacing, h = n.invalidateOnRefresh, m = n.anticipatePin, w = n.onScrubComplete, b = n.onSnapComplete, S = n.once, x = n.snap, T = n.pinReparent, O = n.pinSpacer, v = n.containerAnimation, P = n.fastScrollEnd, C = n.preventOverlaps, k = t.horizontal || t.containerAnimation && t.horizontal !== !1 ? it : Pe, N = !_ && _ !== 0, D = st(t.scroller || X), H = E.core.getCache(D), I = Zr(D), K = ("pinType" in t ? t.pinType : kr(D, "pinType") || I && "fixed") === "fixed", W = [t.onEnter, t.onLeave, t.onEnterBack, t.onLeaveBack], A = N && t.toggleActions.split(" "), Q = "markers" in t ? t.markers : Sn.markers, re = I ? 0 : parseFloat(Mt(D)["border" + k.p2 + ki]) || 0, g = this, se = t.onRefreshInit && function() {
      return t.onRefreshInit(g);
    }, Ke = $l(D, I, k), At = Gl(D, I), he = 0, Ae = 0, Be = 0, _e = Dr(D, k), Qe, Ne, fr, Ye, Ze, Z, me, nt, _t, y, dt, Zt, cr, de, jt, hr, Rr, Oe, _r, ye, zt, Ct, Jt, Ci, we, _n, er, ti, ri, dr, Ar, U, zr, Ft, Lt, It, Fr, ii, tr;
    if (g._startClamp = g._endClamp = !1, g._dir = k, m *= 45, g.scroller = D, g.scroll = v ? v.time.bind(v) : _e, Ye = _e(), Cr && _e.rec == null && (_e.rec = Ye), g.vars = t, i = i || t.animation, "refreshPriority" in t && (tu = 1, t.refreshPriority === -9999 && (Qi = g)), H.tweenScroll = H.tweenScroll || {
      top: Ho(D, Pe),
      left: Ho(D, it)
    }, g.tweenTo = Qe = H.tweenScroll[k.p], g.scrubDuration = function(M) {
      zr = Bi(M) && M, zr ? U ? U.duration(M) : U = E.to(i, {
        ease: "expo",
        totalProgress: "+=0",
        inherit: !1,
        duration: zr,
        paused: !0,
        onComplete: function() {
          return w && w(g);
        }
      }) : (U && U.progress(1).kill(), U = 0);
    }, i && (i.vars.lazy = !1, i._initted && !g.isReverted || i.vars.immediateRender !== !1 && t.immediateRender !== !1 && i.duration() && i.render(0, !0, !0), g.animation = i.pause(), i.scrollTrigger = g, g.scrubDuration(_), dr = 0, u || (u = i.vars.id)), x && ((!Xr(x) || x.push) && (x = {
      snapTo: x
    }), "scrollBehavior" in J.style && E.set(I ? [J, vt] : D, {
      scrollBehavior: "auto"
    }), q.forEach(function(M) {
      return Ge(M) && M.target === (I ? ee.scrollingElement || vt : D) && (M.smooth = !1);
    }), fr = Ge(x.snapTo) ? x.snapTo : x.snapTo === "labels" ? Kl(i) : x.snapTo === "labelsDirectional" ? Ql(i) : x.directional !== !1 ? function(M, F) {
      return fo(x.snapTo)(M, We() - Ae < 500 ? 0 : F.direction);
    } : E.utils.snap(x.snapTo), Ft = x.duration || {
      min: 0.1,
      max: 2
    }, Ft = Xr(Ft) ? Wi(Ft.min, Ft.max) : Wi(Ft, Ft), Lt = E.delayedCall(x.delay || zr / 2 || 0.1, function() {
      var M = _e(), F = We() - Ae < 500, R = Qe.tween;
      if ((F || Math.abs(g.getVelocity()) < 10) && !R && !rs && he !== M) {
        var L = (M - Z) / de, Me = i && !N ? i.totalProgress() : L, $ = F ? 0 : (Me - Ar) / (We() - Fi) * 1e3 || 0, ve = E.utils.clamp(-L, 1 - L, oi($ / 2) * $ / 0.185), Xe = L + (x.inertia === !1 ? 0 : ve), pe, oe, ie = x, Bt = ie.onStart, ue = ie.onInterrupt, pt = ie.onComplete;
        if (pe = fr(Xe, g), Bi(pe) || (pe = Xe), oe = Math.max(0, Math.round(Z + pe * de)), M <= me && M >= Z && oe !== M) {
          if (R && !R._initted && R.data <= oi(oe - M))
            return;
          x.inertia === !1 && (ve = pe - L), Qe(oe, {
            duration: Ft(oi(Math.max(oi(Xe - Me), oi(pe - Me)) * 0.185 / $ / 0.05 || 0)),
            ease: x.ease || "power3",
            data: oi(oe - M),
            // record the distance so that if another snap tween occurs (conflict) we can prioritize the closest snap.
            onInterrupt: function() {
              return Lt.restart(!0) && ue && si(g, ue);
            },
            onComplete: function() {
              g.update(), he = _e(), i && !N && (U ? U.resetTo("totalProgress", pe, i._tTime / i._tDur) : i.progress(pe)), dr = Ar = i && !N ? i.totalProgress() : g.progress, b && b(g), pt && si(g, pt);
            }
          }, M, ve * de, oe - M - ve * de), Bt && si(g, Bt, Qe.tween);
        }
      } else g.isActive && he !== M && Lt.restart(!0);
    }).pause()), u && (Is[u] = g), d = g.trigger = st(d || c !== !0 && c), tr = d && d._gsap && d._gsap.stRevert, tr && (tr = tr(g)), c = c === !0 ? d : st(c), mt(o) && (o = {
      targets: d,
      className: o
    }), c && (p === !1 || p === Ot || (p = !p && c.parentNode && c.parentNode.style && Mt(c.parentNode).display === "flex" ? !1 : Te), g.pin = c, Ne = E.core.getCache(c), Ne.spacer ? jt = Ne.pinState : (O && (O = st(O), O && !O.nodeType && (O = O.current || O.nativeElement), Ne.spacerIsNative = !!O, O && (Ne.spacerState = Cn(O))), Ne.spacer = Oe = O || ee.createElement("div"), Oe.classList.add("pin-spacer"), u && Oe.classList.add("pin-spacer-" + u), Ne.pinState = jt = Cn(c)), t.force3D !== !1 && E.set(c, {
      force3D: !0
    }), g.spacer = Oe = Ne.spacer, ri = Mt(c), Ci = ri[p + k.os2], ye = E.getProperty(c), zt = E.quickSetter(c, k.a, Ce), gs(c, Oe, ri), Rr = Cn(c)), Q) {
      Zt = Xr(Q) ? Xo(Q, qo) : qo, y = kn("scroller-start", u, D, k, Zt, 0), dt = kn("scroller-end", u, D, k, Zt, 0, y), _r = y["offset" + k.op.d2];
      var Pi = st(kr(D, "content") || D);
      nt = this.markerStart = kn("start", u, Pi, k, Zt, _r, 0, v), _t = this.markerEnd = kn("end", u, Pi, k, Zt, _r, 0, v), v && (ii = E.quickSetter([nt, _t], k.a, Ce)), !K && !(Kt.length && kr(D, "fixedMarkers") === !0) && (Hl(I ? J : D), E.set([y, dt], {
        force3D: !0
      }), _n = E.quickSetter(y, k.a, Ce), ti = E.quickSetter(dt, k.a, Ce));
    }
    if (v) {
      var B = v.vars.onUpdate, z = v.vars.onUpdateParams;
      v.eventCallback("onUpdate", function() {
        g.update(0, 0, 1), B && B.apply(v, z || []);
      });
    }
    if (g.previous = function() {
      return Y[Y.indexOf(g) - 1];
    }, g.next = function() {
      return Y[Y.indexOf(g) + 1];
    }, g.revert = function(M, F) {
      if (!F)
        return g.kill(!0);
      var R = M !== !1 || !g.enabled, L = Ue;
      R !== g.isReverted && (R && (It = Math.max(_e(), g.scroll.rec || 0), Be = g.progress, Fr = i && i.progress()), nt && [nt, _t, y, dt].forEach(function(Me) {
        return Me.style.display = R ? "none" : "block";
      }), R && (Ue = g, g.update(R)), c && (!T || !g.isActive) && (R ? Jl(c, Oe, jt) : gs(c, Oe, Mt(c), we)), R || g.update(R), Ue = L, g.isReverted = R);
    }, g.refresh = function(M, F, R, L) {
      if (!((Ue || !g.enabled) && !F)) {
        if (c && M && Rt) {
          Ee(a, "scrollEnd", hu);
          return;
        }
        !rt && se && se(g), Ue = g, Qe.tween && !R && (Qe.tween.kill(), Qe.tween = 0), U && U.pause(), h && i && (i.revert({
          kill: !1
        }).invalidate(), i.getChildren ? i.getChildren(!0, !0, !1).forEach(function(pr) {
          return pr.vars.immediateRender && pr.render(0, !0, !0);
        }) : i.vars.immediateRender && i.render(0, !0, !0)), g.isReverted || g.revert(!0, !0), g._subPinOffset = !1;
        var Me = Ke(), $ = At(), ve = v ? v.duration() : Ht(D, k), Xe = de <= 0.01 || !de, pe = 0, oe = L || 0, ie = Xr(R) ? R.end : t.end, Bt = t.endTrigger || d, ue = Xr(R) ? R.start : t.start || (t.start === 0 || !d ? 0 : c ? "0 0" : "0 100%"), pt = g.pinnedContainer = t.pinnedContainer && st(t.pinnedContainer, g), Xt = d && Math.max(0, Y.indexOf(g)) || 0, ze = Xt, Fe, qe, Lr, dn, Ve, ke, qt, is, po, Oi, Vt, Mi, pn;
        for (Q && Xr(R) && (Mi = E.getProperty(y, k.p), pn = E.getProperty(dt, k.p)); ze-- > 0; )
          ke = Y[ze], ke.end || ke.refresh(0, 1) || (Ue = g), qt = ke.pin, qt && (qt === d || qt === c || qt === pt) && !ke.isReverted && (Oi || (Oi = []), Oi.unshift(ke), ke.revert(!0, !0)), ke !== Y[ze] && (Xt--, ze--);
        for (Ge(ue) && (ue = ue(g)), ue = Io(ue, "start", g), Z = $o(ue, d, Me, k, _e(), nt, y, g, $, re, K, ve, v, g._startClamp && "_startClamp") || (c ? -1e-3 : 0), Ge(ie) && (ie = ie(g)), mt(ie) && !ie.indexOf("+=") && (~ie.indexOf(" ") ? ie = (mt(ue) ? ue.split(" ")[0] : "") + ie : (pe = zn(ie.substr(2), Me), ie = mt(ue) ? ue : (v ? E.utils.mapRange(0, v.duration(), v.scrollTrigger.start, v.scrollTrigger.end, Z) : Z) + pe, Bt = d)), ie = Io(ie, "end", g), me = Math.max(Z, $o(ie || (Bt ? "100% 0" : ve), Bt, Me, k, _e() + pe, _t, dt, g, $, re, K, ve, v, g._endClamp && "_endClamp")) || -1e-3, pe = 0, ze = Xt; ze--; )
          ke = Y[ze] || {}, qt = ke.pin, qt && ke.start - ke._pinPush <= Z && !v && ke.end > 0 && (Fe = ke.end - (g._startClamp ? Math.max(0, ke.start) : ke.start), (qt === d && ke.start - ke._pinPush < Z || qt === pt) && isNaN(ue) && (pe += Fe * (1 - ke.progress)), qt === c && (oe += Fe));
        if (Z += pe, me += pe, g._startClamp && (g._startClamp += pe), g._endClamp && !rt && (g._endClamp = me || -1e-3, me = Math.min(me, Ht(D, k))), de = me - Z || (Z -= 0.01) && 1e-3, Xe && (Be = E.utils.clamp(0, 1, E.utils.normalize(Z, me, It))), g._pinPush = oe, nt && pe && (Fe = {}, Fe[k.a] = "+=" + pe, pt && (Fe[k.p] = "-=" + _e()), E.set([nt, _t], Fe)), c && !(Ls && g.end >= Ht(D, k)))
          Fe = Mt(c), dn = k === Pe, Lr = _e(), Ct = parseFloat(ye(k.a)) + oe, !ve && me > 1 && (Vt = (I ? ee.scrollingElement || vt : D).style, Vt = {
            style: Vt,
            value: Vt["overflow" + k.a.toUpperCase()]
          }, I && Mt(J)["overflow" + k.a.toUpperCase()] !== "scroll" && (Vt.style["overflow" + k.a.toUpperCase()] = "scroll")), gs(c, Oe, Fe), Rr = Cn(c), qe = nr(c, !0), is = K && Dr(D, dn ? it : Pe)(), p ? (we = [p + k.os2, de + oe + Ce], we.t = Oe, ze = p === Te ? Zn(c, k) + de + oe : 0, ze && (we.push(k.d, ze + Ce), Oe.style.flexBasis !== "auto" && (Oe.style.flexBasis = ze + Ce)), vi(we), pt && Y.forEach(function(pr) {
            pr.pin === pt && pr.vars.pinSpacing !== !1 && (pr._subPinOffset = !0);
          }), K && _e(It)) : (ze = Zn(c, k), ze && Oe.style.flexBasis !== "auto" && (Oe.style.flexBasis = ze + Ce)), K && (Ve = {
            top: qe.top + (dn ? Lr - Z : is) + Ce,
            left: qe.left + (dn ? is : Lr - Z) + Ce,
            boxSizing: "border-box",
            position: "fixed"
          }, Ve[Hr] = Ve["max" + ki] = Math.ceil(qe.width) + Ce, Ve[Kr] = Ve["max" + lo] = Math.ceil(qe.height) + Ce, Ve[Ot] = Ve[Ot + Hi] = Ve[Ot + $i] = Ve[Ot + Ki] = Ve[Ot + Gi] = "0", Ve[Te] = Fe[Te], Ve[Te + Hi] = Fe[Te + Hi], Ve[Te + $i] = Fe[Te + $i], Ve[Te + Ki] = Fe[Te + Ki], Ve[Te + Gi] = Fe[Te + Gi], hr = tf(jt, Ve, T), rt && _e(0)), i ? (po = i._initted, hs(1), i.render(i.duration(), !0, !0), Jt = ye(k.a) - Ct + de + oe, er = Math.abs(de - Jt) > 1, K && er && hr.splice(hr.length - 2, 2), i.render(0, !0, !0), po || i.invalidate(!0), i.parent || i.totalTime(i.totalTime()), hs(0)) : Jt = de, Vt && (Vt.value ? Vt.style["overflow" + k.a.toUpperCase()] = Vt.value : Vt.style.removeProperty("overflow-" + k.a));
        else if (d && _e() && !v)
          for (qe = d.parentNode; qe && qe !== J; )
            qe._pinOffset && (Z -= qe._pinOffset, me -= qe._pinOffset), qe = qe.parentNode;
        Oi && Oi.forEach(function(pr) {
          return pr.revert(!1, !0);
        }), g.start = Z, g.end = me, Ye = Ze = rt ? It : _e(), !v && !rt && !Cr && (Ye < It && _e(It), g.scroll.rec = 0), g.revert(!1, !0), Ae = We(), Lt && (he = -1, Lt.restart(!0)), Ue = 0, i && N && (i._initted || Fr) && i.progress() !== Fr && i.progress(Fr || 0, !0).render(i.time(), !0, !0), (Xe || Be !== g.progress || v || h || i && !i._initted) && (i && !N && (i._initted || Be || i.vars.immediateRender !== !1) && i.totalProgress(v && Z < -1e-3 && !Be ? E.utils.normalize(Z, me, 0) : Be, !0), g.progress = Xe || (Ye - Z) / de === Be ? 0 : Be), c && p && (Oe._pinOffset = Math.round(g.progress * Jt)), U && U.invalidate(), isNaN(Mi) || (Mi -= E.getProperty(y, k.p), pn -= E.getProperty(dt, k.p), Pn(y, k, Mi), Pn(nt, k, Mi - (L || 0)), Pn(dt, k, pn), Pn(_t, k, pn - (L || 0))), Xe && !rt && g.update(), f && !rt && !cr && (cr = !0, f(g), cr = !1);
      }
    }, g.getVelocity = function() {
      return (_e() - Ze) / (We() - Fi) * 1e3 || 0;
    }, g.endAnimation = function() {
      Ri(g.callbackAnimation), i && (U ? U.progress(1) : i.paused() ? N || Ri(i, g.direction < 0, 1) : Ri(i, i.reversed()));
    }, g.labelToScroll = function(M) {
      return i && i.labels && (Z || g.refresh() || Z) + i.labels[M] / i.duration() * de || 0;
    }, g.getTrailing = function(M) {
      var F = Y.indexOf(g), R = g.direction > 0 ? Y.slice(0, F).reverse() : Y.slice(F + 1);
      return (mt(M) ? R.filter(function(L) {
        return L.vars.preventOverlaps === M;
      }) : R).filter(function(L) {
        return g.direction > 0 ? L.end <= Z : L.start >= me;
      });
    }, g.update = function(M, F, R) {
      if (!(v && !R && !M)) {
        var L = rt === !0 ? It : g.scroll(), Me = M ? 0 : (L - Z) / de, $ = Me < 0 ? 0 : Me > 1 ? 1 : Me || 0, ve = g.progress, Xe, pe, oe, ie, Bt, ue, pt, Xt;
        if (F && (Ze = Ye, Ye = v ? _e() : L, x && (Ar = dr, dr = i && !N ? i.totalProgress() : $)), m && c && !Ue && !xn && Rt && (!$ && Z < L + (L - Ze) / (We() - Fi) * m ? $ = 1e-4 : $ === 1 && me > L + (L - Ze) / (We() - Fi) * m && ($ = 0.9999)), $ !== ve && g.enabled) {
          if (Xe = g.isActive = !!$ && $ < 1, pe = !!ve && ve < 1, ue = Xe !== pe, Bt = ue || !!$ != !!ve, g.direction = $ > ve ? 1 : -1, g.progress = $, Bt && !Ue && (oe = $ && !ve ? 0 : $ === 1 ? 1 : ve === 1 ? 2 : 3, N && (ie = !ue && A[oe + 1] !== "none" && A[oe + 1] || A[oe], Xt = i && (ie === "complete" || ie === "reset" || ie in i))), C && (ue || Xt) && (Xt || _ || !i) && (Ge(C) ? C(g) : g.getTrailing(C).forEach(function(Lr) {
            return Lr.endAnimation();
          })), N || (U && !Ue && !xn ? (U._dp._time - U._start !== U._time && U.render(U._dp._time - U._start), U.resetTo ? U.resetTo("totalProgress", $, i._tTime / i._tDur) : (U.vars.totalProgress = $, U.invalidate().restart())) : i && i.totalProgress($, !!(Ue && (Ae || M)))), c) {
            if (M && p && (Oe.style[p + k.os2] = Ci), !K)
              zt(Ii(Ct + Jt * $));
            else if (Bt) {
              if (pt = !M && $ > ve && me + 1 > L && L + 1 >= Ht(D, k), T)
                if (!M && (Xe || pt)) {
                  var ze = nr(c, !0), Fe = L - Z;
                  Go(c, J, ze.top + (k === Pe ? Fe : 0) + Ce, ze.left + (k === Pe ? 0 : Fe) + Ce);
                } else
                  Go(c, Oe);
              vi(Xe || pt ? hr : Rr), er && $ < 1 && Xe || zt(Ct + ($ === 1 && !pt ? Jt : 0));
            }
          }
          x && !Qe.tween && !Ue && !xn && Lt.restart(!0), o && (ue || S && $ && ($ < 1 || !_s)) && an(o.targets).forEach(function(Lr) {
            return Lr.classList[Xe || S ? "add" : "remove"](o.className);
          }), s && !N && !M && s(g), Bt && !Ue ? (N && (Xt && (ie === "complete" ? i.pause().totalProgress(1) : ie === "reset" ? i.restart(!0).pause() : ie === "restart" ? i.restart(!0) : i[ie]()), s && s(g)), (ue || !_s) && (l && ue && si(g, l), W[oe] && si(g, W[oe]), S && ($ === 1 ? g.kill(!1, 1) : W[oe] = 0), ue || (oe = $ === 1 ? 1 : 3, W[oe] && si(g, W[oe]))), P && !Xe && Math.abs(g.getVelocity()) > (Bi(P) ? P : 2500) && (Ri(g.callbackAnimation), U ? U.progress(1) : Ri(i, ie === "reverse" ? 1 : !$, 1))) : N && s && !Ue && s(g);
        }
        if (ti) {
          var qe = v ? L / v.duration() * (v._caScrollDist || 0) : L;
          _n(qe + (y._isFlipped ? 1 : 0)), ti(qe);
        }
        ii && ii(-L / v.duration() * (v._caScrollDist || 0));
      }
    }, g.enable = function(M, F) {
      g.enabled || (g.enabled = !0, Ee(D, "resize", Ni), I || Ee(D, "scroll", ai), se && Ee(a, "refreshInit", se), M !== !1 && (g.progress = Be = 0, Ye = Ze = he = _e()), F !== !1 && g.refresh());
    }, g.getTween = function(M) {
      return M && Qe ? Qe.tween : U;
    }, g.setPositions = function(M, F, R, L) {
      if (v) {
        var Me = v.scrollTrigger, $ = v.duration(), ve = Me.end - Me.start;
        M = Me.start + ve * M / $, F = Me.start + ve * F / $;
      }
      g.refresh(!1, !1, {
        start: Bo(M, R && !!g._startClamp),
        end: Bo(F, R && !!g._endClamp)
      }, L), g.update();
    }, g.adjustPinSpacing = function(M) {
      if (we && M) {
        var F = we.indexOf(k.d) + 1;
        we[F] = parseFloat(we[F]) + M + Ce, we[1] = parseFloat(we[1]) + M + Ce, vi(we);
      }
    }, g.disable = function(M, F) {
      if (M !== !1 && g.revert(!0, !0), g.enabled && (g.enabled = g.isActive = !1, F || U && U.pause(), It = 0, Ne && (Ne.uncache = 1), se && De(a, "refreshInit", se), Lt && (Lt.pause(), Qe.tween && Qe.tween.kill() && (Qe.tween = 0)), !I)) {
        for (var R = Y.length; R--; )
          if (Y[R].scroller === D && Y[R] !== g)
            return;
        De(D, "resize", Ni), I || De(D, "scroll", ai);
      }
    }, g.kill = function(M, F) {
      g.disable(M, F), U && !F && U.kill(), u && delete Is[u];
      var R = Y.indexOf(g);
      R >= 0 && Y.splice(R, 1), R === tt && Ln > 0 && tt--, R = 0, Y.forEach(function(L) {
        return L.scroller === g.scroller && (R = 1);
      }), R || rt || Cr || (g.scroll.rec = 0), i && (i.scrollTrigger = null, M && i.revert({
        kill: !1
      }), F || i.kill()), nt && [nt, _t, y, dt].forEach(function(L) {
        return L.parentNode && L.parentNode.removeChild(L);
      }), Qi === g && (Qi = 0), c && (Ne && (Ne.uncache = 1), R = 0, Y.forEach(function(L) {
        return L.pin === c && R++;
      }), R || (Ne.spacer = 0)), t.onKill && t.onKill(g);
    }, Y.push(g), g.enable(!1, !1), tr && tr(g), i && i.add && !de) {
      var j = g.update;
      g.update = function() {
        g.update = j, q.cache++, Z || me || g.refresh();
      }, E.delayedCall(0.01, g.update), de = 0.01, Z = me = 0;
    } else
      g.refresh();
    c && jl();
  }, a.register = function(t) {
    return ui || (E = t || ou(), su() && window.document && a.enable(), ui = Li), ui;
  }, a.defaults = function(t) {
    if (t)
      for (var i in t)
        Sn[i] = t[i];
    return Sn;
  }, a.disable = function(t, i) {
    Li = 0, Y.forEach(function(s) {
      return s[i ? "kill" : "disable"](t);
    }), De(X, "wheel", ai), De(ee, "scroll", ai), clearInterval(vn), De(ee, "touchcancel", Wt), De(J, "touchstart", Wt), wn(De, ee, "pointerdown,touchstart,mousedown", No), wn(De, ee, "pointerup,touchend,mouseup", Yo), Qn.kill(), bn(De);
    for (var n = 0; n < q.length; n += 3)
      Tn(De, q[n], q[n + 1]), Tn(De, q[n], q[n + 2]);
  }, a.enable = function() {
    if (X = window, ee = document, vt = ee.documentElement, J = ee.body, E) {
      if (an = E.utils.toArray, Wi = E.utils.clamp, Fs = E.core.context || Wt, hs = E.core.suppressOverwrites || Wt, so = X.history.scrollRestoration || "auto", Bs = X.pageYOffset || 0, E.core.globals("ScrollTrigger", a), J) {
        Li = 1, yi = document.createElement("div"), yi.style.height = "100vh", yi.style.position = "absolute", gu(), Wl(), be.register(E), a.isTouch = be.isTouch, gr = be.isTouch && /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent), zs = be.isTouch === 1, Ee(X, "wheel", ai), no = [X, ee, vt, J], E.matchMedia ? (a.matchMedia = function(f) {
          var _ = E.matchMedia(), d;
          for (d in f)
            _.add(d, f[d]);
          return _;
        }, E.addEventListener("matchMediaInit", function() {
          du(), co();
        }), E.addEventListener("matchMediaRevert", function() {
          return _u();
        }), E.addEventListener("matchMedia", function() {
          Vr(0, 1), Jr("matchMedia");
        }), E.matchMedia().add("(orientation: portrait)", function() {
          return ps(), ps;
        })) : console.warn("Requires GSAP 3.11.0 or later"), ps(), Ee(ee, "scroll", ai);
        var t = J.hasAttribute("style"), i = J.style, n = i.borderTopStyle, s = E.core.Animation.prototype, o, u;
        for (s.revert || Object.defineProperty(s, "revert", {
          value: function() {
            return this.time(-0.01, !0);
          }
        }), i.borderTopStyle = "solid", o = nr(J), Pe.m = Math.round(o.top + Pe.sc()) || 0, it.m = Math.round(o.left + it.sc()) || 0, n ? i.borderTopStyle = n : i.removeProperty("border-top-style"), t || (J.setAttribute("style", ""), J.removeAttribute("style")), vn = setInterval(Vo, 250), E.delayedCall(0.5, function() {
          return xn = 0;
        }), Ee(ee, "touchcancel", Wt), Ee(J, "touchstart", Wt), wn(Ee, ee, "pointerdown,touchstart,mousedown", No), wn(Ee, ee, "pointerup,touchend,mouseup", Yo), As = E.utils.checkPrefix("transform"), In.push(As), ui = We(), Qn = E.delayedCall(0.2, Vr).pause(), li = [ee, "visibilitychange", function() {
          var f = X.innerWidth, _ = X.innerHeight;
          ee.hidden ? (Fo = f, Lo = _) : (Fo !== f || Lo !== _) && Ni();
        }, ee, "DOMContentLoaded", Vr, X, "load", Vr, X, "resize", Ni], bn(Ee), Y.forEach(function(f) {
          return f.enable(0, 1);
        }), u = 0; u < q.length; u += 3)
          Tn(De, q[u], q[u + 1]), Tn(De, q[u], q[u + 2]);
      } else if (ee) {
        var l = function f() {
          a.enable(), ee.removeEventListener("DOMContentLoaded", f);
        };
        ee.addEventListener("DOMContentLoaded", l);
      }
    }
  }, a.config = function(t) {
    "limitCallbacks" in t && (_s = !!t.limitCallbacks);
    var i = t.syncInterval;
    i && clearInterval(vn) || (vn = i) && setInterval(Vo, i), "ignoreMobileResize" in t && (zs = a.isTouch === 1 && t.ignoreMobileResize), "autoRefreshEvents" in t && (bn(De) || bn(Ee, t.autoRefreshEvents || "none"), ru = (t.autoRefreshEvents + "").indexOf("resize") === -1);
  }, a.scrollerProxy = function(t, i) {
    var n = st(t), s = q.indexOf(n), o = Zr(n);
    ~s && q.splice(s, o ? 6 : 2), i && (o ? Kt.unshift(X, i, J, i, vt, i) : Kt.unshift(n, i));
  }, a.clearMatchMedia = function(t) {
    Y.forEach(function(i) {
      return i._ctx && i._ctx.query === t && i._ctx.kill(!0, !0);
    });
  }, a.isInViewport = function(t, i, n) {
    var s = (mt(t) ? st(t) : t).getBoundingClientRect(), o = s[n ? Hr : Kr] * i || 0;
    return n ? s.right - o > 0 && s.left + o < X.innerWidth : s.bottom - o > 0 && s.top + o < X.innerHeight;
  }, a.positionInViewport = function(t, i, n) {
    mt(t) && (t = st(t));
    var s = t.getBoundingClientRect(), o = s[n ? Hr : Kr], u = i == null ? o / 2 : i in jn ? jn[i] * o : ~i.indexOf("%") ? parseFloat(i) * o / 100 : parseFloat(i) || 0;
    return n ? (s.left + u) / X.innerWidth : (s.top + u) / X.innerHeight;
  }, a.killAll = function(t) {
    if (Y.slice(0).forEach(function(n) {
      return n.vars.id !== "ScrollSmoother" && n.kill();
    }), t !== !0) {
      var i = jr.killAll || [];
      jr = {}, i.forEach(function(n) {
        return n();
      });
    }
  }, a;
})();
V.version = "3.15.1";
V.saveStyles = function(a) {
  return a ? an(a).forEach(function(e) {
    if (e && e.style) {
      var r = gt.indexOf(e);
      r >= 0 && gt.splice(r, 5), gt.push(e, e.style.cssText, e.getBBox && e.getAttribute("transform"), E.core.getCache(e), Fs());
    }
  }) : gt;
};
V.revert = function(a, e) {
  return co(!a, e);
};
V.create = function(a, e) {
  return new V(a, e);
};
V.refresh = function(a) {
  return a ? Ni(!0) : (ui || V.register()) && Vr(!0);
};
V.update = function(a) {
  return ++q.cache && ar(a === !0 ? 2 : 0);
};
V.clearScrollMemory = pu;
V.maxScroll = function(a, e) {
  return Ht(a, e ? it : Pe);
};
V.getScrollFunc = function(a, e) {
  return Dr(st(a), e ? it : Pe);
};
V.getById = function(a) {
  return Is[a];
};
V.getAll = function() {
  return Y.filter(function(a) {
    return a.vars.id !== "ScrollSmoother";
  });
};
V.isScrolling = function() {
  return !!Rt;
};
V.snapDirectional = fo;
V.addEventListener = function(a, e) {
  var r = jr[a] || (jr[a] = []);
  ~r.indexOf(e) || r.push(e);
};
V.removeEventListener = function(a, e) {
  var r = jr[a], t = r && r.indexOf(e);
  t >= 0 && r.splice(t, 1);
};
V.batch = function(a, e) {
  var r = [], t = {}, i = e.interval || 0.016, n = e.batchMax || 1e9, s = function(l, f) {
    var _ = [], d = [], c = E.delayedCall(i, function() {
      f(_, d), _ = [], d = [];
    }).pause();
    return function(p) {
      _.length || c.restart(!0), _.push(p.trigger), d.push(p), n <= _.length && c.progress(1);
    };
  }, o;
  for (o in e)
    t[o] = o.substr(0, 2) === "on" && Ge(e[o]) && o !== "onRefreshInit" ? s(o, e[o]) : e[o];
  return Ge(n) && (n = n(), Ee(V, "refresh", function() {
    return n = e.batchMax();
  })), an(a).forEach(function(u) {
    var l = {};
    for (o in t)
      l[o] = t[o];
    l.trigger = u, r.push(V.create(l));
  }), r;
};
var Ko = function(e, r, t, i) {
  return r > i ? e(i) : r < 0 && e(0), t > i ? (i - r) / (t - r) : t < 0 ? r / (r - t) : 1;
}, ms = function a(e, r) {
  r === !0 ? e.style.removeProperty("touch-action") : e.style.touchAction = r === !0 ? "auto" : r ? "pan-" + r + (be.isTouch ? " pinch-zoom" : "") : "none", e === vt && a(J, r);
}, On = {
  auto: 1,
  scroll: 1
}, nf = function(e) {
  var r = e.event, t = e.target, i = e.axis, n = (r.changedTouches ? r.changedTouches[0] : r).target, s = n._gsap || E.core.getCache(n), o = We(), u;
  if (!s._isScrollT || o - s._isScrollT > 2e3) {
    for (; n && n !== J && (n.scrollHeight <= n.clientHeight && n.scrollWidth <= n.clientWidth || !(On[(u = Mt(n)).overflowY] || On[u.overflowX])); )
      n = n.parentNode;
    s._isScroll = n && n !== t && !Zr(n) && (On[(u = Mt(n)).overflowY] || On[u.overflowX]), s._isScrollT = o;
  }
  (s._isScroll || i === "x") && (r.stopPropagation(), r._gsapAllow = !0);
}, yu = function(e, r, t, i) {
  return be.create({
    target: e,
    capture: !0,
    debounce: !1,
    lockAxis: !0,
    type: r,
    onWheel: i = i && nf,
    onPress: i,
    onDrag: i,
    onScroll: i,
    onEnable: function() {
      return t && Ee(ee, be.eventTypes[0], Zo, !1, !0);
    },
    onDisable: function() {
      return De(ee, be.eventTypes[0], Zo, !0);
    }
  });
}, sf = /(input|label|select|textarea)/i, Qo, Zo = function(e) {
  var r = sf.test(e.target.tagName);
  (r || Qo) && (e._gsapAllow = !0, Qo = r);
}, of = function(e) {
  Xr(e) || (e = {}), e.preventDefault = e.isNormalizer = e.allowClicks = !0, e.type || (e.type = "wheel,touch"), e.debounce = !!e.debounce, e.id = e.id || "normalizer";
  var r = e, t = r.normalizeScrollX, i = r.momentum, n = r.allowNestedScroll, s = r.onRelease, o, u, l = st(e.target) || vt, f = E.core.globals().ScrollSmoother, _ = f && f.get(), d = gr && (e.content && st(e.content) || _ && e.content !== !1 && !_.smooth() && _.content()), c = Dr(l, Pe), p = Dr(l, it), h = 1, m = (be.isTouch && X.visualViewport ? X.visualViewport.scale * X.visualViewport.width : X.outerWidth) / X.innerWidth, w = 0, b = Ge(i) ? function() {
    return i(o);
  } : function() {
    return i || 2.8;
  }, S, x, T = yu(l, e.type, !0, n), O = function() {
    return x = !1;
  }, v = Wt, P = Wt, C = function() {
    u = Ht(l, Pe), P = Wi(gr ? 1 : 0, u), t && (v = Wi(0, Ht(l, it))), S = Qr;
  }, k = function() {
    d._gsap.y = Ii(parseFloat(d._gsap.y) + c.offset) + "px", d.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + parseFloat(d._gsap.y) + ", 0, 1)", c.offset = c.cacheID = 0;
  }, N = function() {
    if (x) {
      requestAnimationFrame(O);
      var Q = Ii(o.deltaY / 2), re = P(c.v - Q);
      if (d && re !== c.v + c.offset) {
        c.offset = re - c.v;
        var g = Ii((parseFloat(d && d._gsap.y) || 0) - c.offset);
        d.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + g + ", 0, 1)", d._gsap.y = g + "px", c.cacheID = q.cache, ar();
      }
      return !0;
    }
    c.offset && k(), x = !0;
  }, D, H, I, K, W = function() {
    C(), D.isActive() && D.vars.scrollY > u && (c() > u ? D.progress(1) && c(u) : D.resetTo("scrollY", u));
  };
  return d && E.set(d, {
    y: "+=0"
  }), e.ignoreCheck = function(A) {
    return gr && A.type === "touchmove" && N() || h > 1.05 && A.type !== "touchstart" || o.isGesturing || A.touches && A.touches.length > 1;
  }, e.onPress = function() {
    x = !1;
    var A = h;
    h = Ii((X.visualViewport && X.visualViewport.scale || 1) / m), D.pause(), A !== h && ms(l, h > 1.01 ? !0 : t ? !1 : "x"), H = p(), I = c(), C(), S = Qr;
  }, e.onRelease = e.onGestureStart = function(A, Q) {
    if (c.offset && k(), !Q)
      K.restart(!0);
    else {
      q.cache++;
      var re = b(), g, se;
      t && (g = p(), se = g + re * 0.05 * -A.velocityX / 0.227, re *= Ko(p, g, se, Ht(l, it)), D.vars.scrollX = v(se)), g = c(), se = g + re * 0.05 * -A.velocityY / 0.227, re *= Ko(c, g, se, Ht(l, Pe)), D.vars.scrollY = P(se), D.invalidate().duration(re).play(0.01), (gr && D.vars.scrollY >= u || g >= u - 1) && E.to({}, {
        onUpdate: W,
        duration: re
      });
    }
    s && s(A);
  }, e.onWheel = function() {
    D._ts && D.pause(), We() - w > 1e3 && (S = 0, w = We());
  }, e.onChange = function(A, Q, re, g, se) {
    if (Qr !== S && C(), Q && t && p(v(g[2] === Q ? H + (A.startX - A.x) : p() + Q - g[1])), re) {
      c.offset && k();
      var Ke = se[2] === re, At = Ke ? I + A.startY - A.y : c() + re - se[1], he = P(At);
      Ke && At !== he && (I += he - At), c(he);
    }
    (re || Q) && ar();
  }, e.onEnable = function() {
    ms(l, t ? !1 : "x"), V.addEventListener("refresh", W), Ee(X, "resize", W), c.smooth && (c.target.style.scrollBehavior = "auto", c.smooth = p.smooth = !1), T.enable();
  }, e.onDisable = function() {
    ms(l, !0), De(X, "resize", W), V.removeEventListener("refresh", W), T.kill();
  }, e.lockAxis = e.lockAxis !== !1, o = new be(e), o.iOS = gr, gr && !c() && c(1), gr && E.ticker.add(Wt), K = o._dc, D = E.to(o, {
    ease: "power4",
    paused: !0,
    inherit: !1,
    scrollX: t ? "+=0.1" : "+=0",
    scrollY: "+=0.1",
    modifiers: {
      scrollY: mu(c, c(), function() {
        return D.pause();
      })
    },
    onUpdate: ar,
    onComplete: K.vars.onComplete
  }), o;
};
V.sort = function(a) {
  if (Ge(a))
    return Y.sort(a);
  var e = X.pageYOffset || 0;
  return V.getAll().forEach(function(r) {
    return r._sortY = r.trigger ? e + r.trigger.getBoundingClientRect().top : r.start + X.innerHeight;
  }), Y.sort(a || function(r, t) {
    return (r.vars.refreshPriority || 0) * -1e6 + (r.vars.containerAnimation ? 1e6 : r._sortY) - ((t.vars.containerAnimation ? 1e6 : t._sortY) + (t.vars.refreshPriority || 0) * -1e6);
  });
};
V.observe = function(a) {
  return new be(a);
};
V.normalizeScroll = function(a) {
  if (typeof a > "u")
    return et;
  if (a === !0 && et)
    return et.enable();
  if (a === !1) {
    et && et.kill(), et = a;
    return;
  }
  var e = a instanceof be ? a : of(a);
  return et && et.target === e.target && et.kill(), Zr(e.target) && (et = e), e;
};
V.core = {
  // smaller file size way to leverage in ScrollSmoother and Observer
  _getVelocityProp: Rs,
  _inputObserver: yu,
  _scrollers: q,
  _proxies: Kt,
  bridge: {
    // when normalizeScroll sets the scroll position (ss = setScroll)
    ss: function() {
      Rt || Jr("scrollStart"), Rt = We();
    },
    // a way to get the _refreshing value in Observer
    ref: function() {
      return Ue;
    }
  }
};
ou() && E.registerPlugin(V);
const af = [
  { id: "davis", name: "Davis", category: "Kinase binding", tag: "Binding affinity", text: "Explore compound–kinase binding with the Davis dataset. This checkout includes training, validation and test CSV splits for the novel-pair setting. The dataset provides one of three evaluation contexts for Perceiver CPI.", detail: "Use the Davis checkpoint with the corresponding Davis data. Labels and evaluation values should be interpreted in the dataset’s own scale; they are not interchangeable with KIBA scores." },
  { id: "kiba", name: "KIBA", category: "Integrated scores", tag: "Integrated bioactivity", text: "Investigate compound–protein interactions using integrated KIBA scores. The local training bundle supplies a dedicated split and trains a separate model for this dataset.", detail: "KIBA scores combine bioactivity information. Use the KIBA model for this dataset and inspect the source data before interpreting outputs. This interface does not display fabricated predictions or performance results." },
  { id: "metz", name: "Metz", category: "Kinase binding", tag: "Kinase interactions", text: "A complementary view of compound–kinase interactions. Metz is the third dataset supported by the training workflow in this project, with its own training, validation and test files.", detail: "The local training runner trains one model for each dataset. Existing scripts retain control of training, checkpoints and evaluation. This site introduces the research and prepares inputs." }
];
sr.registerPlugin(V);
const cn = matchMedia("(prefers-reduced-motion: reduce)").matches, Mn = document.querySelector(".loader");
let vu;
const xu = () => {
  Mn.hidden || (cn ? Mn.hidden = !0 : sr.to(Mn, { yPercent: -100, duration: 0.8, ease: "power3.inOut", onComplete: () => {
    Mn.hidden = !0;
  } }));
}, uf = setTimeout(xu, 3500);
import("./scene-txdEDDbL.js").then(({ createWorld: a }) => {
  vu = a(document.querySelector("#world"), cn);
}).catch(() => document.body.classList.add("fallback")).finally(() => {
  clearTimeout(uf), xu();
});
const wr = document.querySelector("#menu"), ln = document.querySelector(".menu-button"), lf = document.querySelector("main"), ff = document.querySelector("footer");
function ho(a) {
  wr.hidden = !a, ln.setAttribute("aria-expanded", String(a)), lf.inert = a, ff.inert = a, document.body.style.overflow = a ? "hidden" : "", a ? (wr.scrollTop = 0, cn || sr.fromTo(wr.querySelectorAll("a"), { y: 35, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.5 }), wr.querySelector("a").focus()) : ln.focus();
}
ln.addEventListener("click", () => ho(wr.hidden));
document.addEventListener("keydown", (a) => {
  if (!wr.hidden && (a.key === "Escape" && ho(!1), a.key === "Tab")) {
    const e = [ln, ...wr.querySelectorAll("a")], r = e.indexOf(document.activeElement);
    a.shiftKey && r <= 0 ? (a.preventDefault(), e.at(-1).focus()) : !a.shiftKey && r === e.length - 1 && (a.preventDefault(), ln.focus());
  }
});
const Yt = document.querySelector("#project-dialog");
let bu, Nn, jo;
function hn() {
  const a = location.hash.replace("#dataset/", ""), e = af.find((r) => r.id === a);
  e ? (Nn = e.id, document.querySelector("#dialog-title").textContent = e.name, document.querySelector("#dialog-copy").textContent = e.text, document.querySelector("#dialog-detail").textContent = e.detail, Yt.open || Yt.showModal()) : Yt.open && Yt.close();
}
document.querySelectorAll("[data-project]").forEach((a) => a.addEventListener("click", () => {
  bu = a, history.pushState({ dataset: !0 }, "", `#dataset/${a.dataset.project}`), hn();
}));
function _o() {
  history.state?.dataset ? history.back() : (history.replaceState(null, "", "#research"), hn());
}
document.querySelector(".dialog-close").addEventListener("click", _o);
Yt.addEventListener("cancel", (a) => {
  a.preventDefault(), _o();
});
Yt.addEventListener("click", (a) => {
  if (a.target !== Yt) return;
  const e = Yt.getBoundingClientRect();
  (a.clientX < e.left || a.clientX > e.right || a.clientY < e.top || a.clientY > e.bottom) && _o();
});
Yt.addEventListener("close", () => bu?.focus());
window.addEventListener("popstate", hn);
window.addEventListener("hashchange", hn);
hn();
document.querySelector("#dialog-explore").addEventListener("click", () => {
  const a = document.querySelector("#dataset");
  Nn && a.value !== Nn && (a.value = Nn, a.dispatchEvent(new Event("change", { bubbles: !0 })));
});
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const r = a.getAttribute("href");
  if (!r || r === "#") return;
  const t = document.getElementById(r.slice(1));
  if (!t) return;
  e.preventDefault(), wr.hidden || ho(!1), Yt.open && Yt.close(), jo?.kill();
  const i = () => {
    t.tagName === "DETAILS" && (t.open = !0), history.pushState(null, "", r), t.scrollIntoView({ behavior: "instant", block: "start" }), t.setAttribute("tabindex", "-1"), t.focus({ preventScroll: !0 }), window.dispatchEvent(new Event("resize"));
  };
  cn ? i() : jo = sr.timeline().set(".transition", { visibility: "visible" }).to(".transition", { yPercent: -101, duration: 0.35, ease: "power3.inOut" }).call(i).to(".transition", { yPercent: -202, duration: 0.45, ease: "power3.inOut" }).set(".transition", { yPercent: 0, visibility: "hidden" });
}));
document.querySelectorAll("[data-filter]").forEach((a) => a.addEventListener("click", () => {
  document.querySelectorAll("[data-filter]").forEach((e) => e.setAttribute("aria-pressed", String(e === a))), document.querySelectorAll(".card").forEach((e) => {
    e.hidden = a.dataset.filter !== "All" && e.dataset.category !== a.dataset.filter;
  }), V.refresh();
}));
sr.context(() => {
  cn || (sr.from(".hero h1 span", { yPercent: 40, opacity: 0, stagger: 0.13, duration: 1.2, delay: 0.8, ease: "power3.out" }), document.querySelectorAll(".intro h2,.section-heading").forEach((a) => sr.from(a, {
    clipPath: "inset(0 0 100% 0)",
    y: 35,
    duration: 1,
    scrollTrigger: { trigger: a, start: "top 90%", once: !0 }
  })), sr.to(".hero h1", { y: -110, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: !0 } })), V.create({ start: 0, end: "max", onUpdate: (a) => {
    document.querySelector(".progress").style.transform = `scaleX(${a.progress})`, vu?.setProgress(Math.min(scrollY / innerHeight, 1)), document.querySelector(".status").style.opacity = scrollY < innerHeight * 0.6 ? "1" : "0";
  } });
});
new URLSearchParams(location.search).has("pair") && document.querySelector("#workspace").scrollIntoView({ behavior: "instant" });
