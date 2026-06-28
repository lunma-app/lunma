/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ engine: NonNullable<unknown> }} Launcher_Overlay_Exitengine1Inputs */

const en_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Exit ${i?.engine} search`)
};

const es_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Salir de búsqueda en ${i?.engine}`)
};

const pt_pt2_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Sair da pesquisa ${i?.engine}`)
};

const fr_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Quitter la recherche ${i?.engine}`)
};

const de_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.engine}-Suche beenden`)
};

const ja_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.engine} 検索を終了`)
};

const ko_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.engine} 검색 종료`)
};

const zh_cn2_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`退出 ${i?.engine} 搜索`)
};

const ru_launcher_overlay_exitengine1 = /** @type {(inputs: Launcher_Overlay_Exitengine1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Выйти из поиска ${i?.engine}`)
};

/**
* | output |
* | --- |
* | "Exit {engine} search" |
*
* @param {Launcher_Overlay_Exitengine1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_exitengine1 = /** @type {((inputs: Launcher_Overlay_Exitengine1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Exitengine1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_exitengine1(inputs)
	if (locale === "es") return es_launcher_overlay_exitengine1(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_overlay_exitengine1(inputs)
	if (locale === "fr") return fr_launcher_overlay_exitengine1(inputs)
	if (locale === "de") return de_launcher_overlay_exitengine1(inputs)
	if (locale === "ja") return ja_launcher_overlay_exitengine1(inputs)
	if (locale === "ko") return ko_launcher_overlay_exitengine1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_exitengine1(inputs)
	return ru_launcher_overlay_exitengine1(inputs)
});
export { launcher_overlay_exitengine1 as "launcher_overlay_exitEngine" }