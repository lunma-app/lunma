/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Autoarchiveenabled2Inputs */

const en_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-archive idle tabs`)
};

const es_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivar pestañas inactivas automáticamente`)
};

const pt_pt2_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arquivar automaticamente separadores inativos`)
};

const fr_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archiver automatiquement les onglets inactifs`)
};

const de_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inaktive Tabs automatisch archivieren`)
};

const ja_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アイドルタブを自動アーカイブ`)
};

const ko_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유휴 탭 자동 보관`)
};

const zh_cn2_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自动归档闲置标签页`)
};

const ru_options_label_autoarchiveenabled2 = /** @type {(inputs: Options_Label_Autoarchiveenabled2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Авто-архивировать простаивающие вкладки`)
};

/**
* | output |
* | --- |
* | "Auto-archive idle tabs" |
*
* @param {Options_Label_Autoarchiveenabled2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_autoarchiveenabled2 = /** @type {((inputs?: Options_Label_Autoarchiveenabled2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Autoarchiveenabled2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_autoarchiveenabled2(inputs)
	if (locale === "es") return es_options_label_autoarchiveenabled2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_label_autoarchiveenabled2(inputs)
	if (locale === "fr") return fr_options_label_autoarchiveenabled2(inputs)
	if (locale === "de") return de_options_label_autoarchiveenabled2(inputs)
	if (locale === "ja") return ja_options_label_autoarchiveenabled2(inputs)
	if (locale === "ko") return ko_options_label_autoarchiveenabled2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_autoarchiveenabled2(inputs)
	return ru_options_label_autoarchiveenabled2(inputs)
});
export { options_label_autoarchiveenabled2 as "options_label_autoArchiveEnabled" }