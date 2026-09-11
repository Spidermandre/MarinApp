import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Titolo } from '../components/ui';
import { tips } from '../data/tips';
export default function Tips() {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(Titolo, { sub: "Le cose che fanno davvero la differenza", children: "Consigli" }), tips.map((t) => (_jsxs(Card, { children: [_jsx("h2", { className: "font-display text-lg font-extrabold leading-tight", children: t.title }), _jsx("p", { className: "mt-2 text-[15px] leading-relaxed", children: t.body })] }, t.title)))] }));
}
