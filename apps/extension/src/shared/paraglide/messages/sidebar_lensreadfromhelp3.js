/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensreadfromhelp3Inputs */

const en_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pick the connections this lens watches — its type is derived.`)
};

const es_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige las conexiones que esta lente supervisa — su tipo se deduce.`)
};

const pt_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escolha as ligações que esta lens monitoriza — o tipo é derivado.`)
};

const fr_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez les connexions que cette vue surveille — son type en est déduit.`)
};

const de_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindungen auswählen, die diese Lens beobachtet — der Typ wird abgeleitet.`)
};

const ja_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このレンズが監視する接続を選択 — タイプが自動的に決まります。`)
};

const ko_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 렌즈가 모니터링할 연결을 선택하세요 — 유형은 자동으로 결정됩니다.`)
};

const zh_cn2_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`选择此镜头监控的连接 — 类型由此推导`)
};

const ru_sidebar_lensreadfromhelp3 = /** @type {(inputs: Sidebar_Lensreadfromhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Выберите подключения для этой линзы — её тип определяется автоматически.`)
};

/**
* | output |
* | --- |
* | "Pick the connections this lens watches — its type is derived." |
*
* @param {Sidebar_Lensreadfromhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensreadfromhelp3 = /** @type {((inputs?: Sidebar_Lensreadfromhelp3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensreadfromhelp3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensreadfromhelp3(inputs)
	if (locale === "es") return es_sidebar_lensreadfromhelp3(inputs)
	if (locale === "pt") return pt_sidebar_lensreadfromhelp3(inputs)
	if (locale === "fr") return fr_sidebar_lensreadfromhelp3(inputs)
	if (locale === "de") return de_sidebar_lensreadfromhelp3(inputs)
	if (locale === "ja") return ja_sidebar_lensreadfromhelp3(inputs)
	if (locale === "ko") return ko_sidebar_lensreadfromhelp3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensreadfromhelp3(inputs)
	return ru_sidebar_lensreadfromhelp3(inputs)
});
export { sidebar_lensreadfromhelp3 as "sidebar_lensReadFromHelp" }