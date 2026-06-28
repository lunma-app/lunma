/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Historydescription1Inputs */

const en_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show matching pages from your browsing history in the launcher.`)
};

const es_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Muestra páginas coincidentes de tu historial en el lanzador.`)
};

const pt_pt2_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar páginas correspondentes do histórico no launcher.`)
};

const fr_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher les pages correspondantes de votre historique dans le lanceur.`)
};

const de_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passende Seiten aus dem Browserverlauf im Launcher anzeigen.`)
};

const ja_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーで閲覧履歴から一致するページを表示。`)
};

const ko_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처에서 브라우징 기록의 일치하는 페이지를 표시합니다.`)
};

const zh_cn2_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`在启动器中显示浏览历史中的匹配页面`)
};

const ru_options_historydescription1 = /** @type {(inputs: Options_Historydescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Показывать страницы из истории в лаунчере.`)
};

/**
* | output |
* | --- |
* | "Show matching pages from your browsing history in the launcher." |
*
* @param {Options_Historydescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_historydescription1 = /** @type {((inputs?: Options_Historydescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Historydescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_historydescription1(inputs)
	if (locale === "es") return es_options_historydescription1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_historydescription1(inputs)
	if (locale === "fr") return fr_options_historydescription1(inputs)
	if (locale === "de") return de_options_historydescription1(inputs)
	if (locale === "ja") return ja_options_historydescription1(inputs)
	if (locale === "ko") return ko_options_historydescription1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_historydescription1(inputs)
	return ru_options_historydescription1(inputs)
});
export { options_historydescription1 as "options_historyDescription" }