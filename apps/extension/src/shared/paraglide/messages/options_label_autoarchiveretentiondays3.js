/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Autoarchiveretentiondays3Inputs */

const en_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep archived tabs for (days)`)
};

const es_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conservar pestañas archivadas (días)`)
};

const pt_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manter separadores arquivados (dias)`)
};

const fr_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conserver les onglets archivés (jours)`)
};

const de_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivierte Tabs behalten für (Tage)`)
};

const ja_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アーカイブ保持期間（日）`)
};

const ko_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보관된 탭 보존 기간(일)`)
};

const zh_cn2_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`归档标签页保留天数`)
};

const ru_options_label_autoarchiveretentiondays3 = /** @type {(inputs: Options_Label_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Хранить архивные вкладки (дней)`)
};

/**
* | output |
* | --- |
* | "Keep archived tabs for (days)" |
*
* @param {Options_Label_Autoarchiveretentiondays3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_autoarchiveretentiondays3 = /** @type {((inputs?: Options_Label_Autoarchiveretentiondays3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Autoarchiveretentiondays3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_autoarchiveretentiondays3(inputs)
	if (locale === "es") return es_options_label_autoarchiveretentiondays3(inputs)
	if (locale === "pt") return pt_options_label_autoarchiveretentiondays3(inputs)
	if (locale === "fr") return fr_options_label_autoarchiveretentiondays3(inputs)
	if (locale === "de") return de_options_label_autoarchiveretentiondays3(inputs)
	if (locale === "ja") return ja_options_label_autoarchiveretentiondays3(inputs)
	if (locale === "ko") return ko_options_label_autoarchiveretentiondays3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_autoarchiveretentiondays3(inputs)
	return ru_options_label_autoarchiveretentiondays3(inputs)
});
export { options_label_autoarchiveretentiondays3 as "options_label_autoArchiveRetentionDays" }