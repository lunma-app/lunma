/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Autoarchiveenabled2Inputs */

const en_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quietly archive temporary tabs left idle so the workspace stays tidy`)
};

const es_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archiva en silencio las pestañas temporales inactivas para mantener el área de trabajo ordenada`)
};

const pt_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arquiva silenciosamente separadores temporários inativos para manter o espaço organizado`)
};

const fr_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archiver discrètement les onglets temporaires inactifs pour garder l'espace de travail ordonné`)
};

const de_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Temporäre inaktive Tabs automatisch archivieren, damit der Arbeitsbereich ordentlich bleibt`)
};

const ja_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アイドル状態の一時タブをこっそりアーカイブして、ワークスペースをすっきり保つ`)
};

const ko_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유휴 상태의 임시 탭을 조용히 보관하여 작업 공간을 깔끔하게 유지`)
};

const zh_cn2_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`悄悄归档闲置的临时标签页，保持工作区整洁`)
};

const ru_options_desc_autoarchiveenabled2 = /** @type {(inputs: Options_Desc_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Тихо архивировать временные вкладки при простое, чтобы рабочее пространство оставалось опрятным`)
};

/**
* | output |
* | --- |
* | "Quietly archive temporary tabs left idle so the workspace stays tidy" |
*
* @param {Options_Desc_Autoarchiveenabled2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_autoarchiveenabled2 = /** @type {((inputs?: Options_Desc_Autoarchiveenabled2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Autoarchiveenabled2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_autoarchiveenabled2(inputs)
	if (locale === "es") return es_options_desc_autoarchiveenabled2(inputs)
	if (locale === "pt") return pt_options_desc_autoarchiveenabled2(inputs)
	if (locale === "fr") return fr_options_desc_autoarchiveenabled2(inputs)
	if (locale === "de") return de_options_desc_autoarchiveenabled2(inputs)
	if (locale === "ja") return ja_options_desc_autoarchiveenabled2(inputs)
	if (locale === "ko") return ko_options_desc_autoarchiveenabled2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_autoarchiveenabled2(inputs)
	return ru_options_desc_autoarchiveenabled2(inputs)
});
export { options_desc_autoarchiveenabled2 as "options_desc_autoArchiveEnabled" }