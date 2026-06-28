/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Pinnedtabboundarydefault3Inputs */

const en_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep new pins on their own site or page; off-bounds links open in a new tab`)
};

const es_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mantiene los nuevos fijados en su sitio; los enlaces externos se abren en una pestaña nueva`)
};

const pt_pt2_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mantém novos fixos no próprio site ou página; ligações fora do limite abrem num novo separador`)
};

const fr_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gardez les nouveaux épingles sur leur propre site ou page ; les liens externes s'ouvrent dans un nouvel onglet`)
};

const de_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue Pins auf ihrer Site oder Seite halten; Links außerhalb öffnen in einem neuen Tab`)
};

const ja_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`固定タブを自分のサイトまたはページに保持 — 範囲外のリンクは新しいタブで開く`)
};

const ko_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 고정 탭은 해당 사이트나 페이지에 머물고, 범위 밖 링크는 새 탭에서 열립니다`)
};

const zh_cn2_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`固定标签页仅在其站点或页面内跳转；站外链接在新标签页中打开`)
};

const ru_options_desc_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Desc_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Держать закреплённые вкладки на своём сайте; ссылки на другие сайты открываются в новой вкладке`)
};

/**
* | output |
* | --- |
* | "Keep new pins on their own site or page; off-bounds links open in a new tab" |
*
* @param {Options_Desc_Pinnedtabboundarydefault3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_pinnedtabboundarydefault3 = /** @type {((inputs?: Options_Desc_Pinnedtabboundarydefault3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Pinnedtabboundarydefault3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "es") return es_options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "pt-PT") return pt_pt2_options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "fr") return fr_options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "de") return de_options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "ja") return ja_options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "ko") return ko_options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_pinnedtabboundarydefault3(inputs)
	return ru_options_desc_pinnedtabboundarydefault3(inputs)
});
export { options_desc_pinnedtabboundarydefault3 as "options_desc_pinnedTabBoundaryDefault" }