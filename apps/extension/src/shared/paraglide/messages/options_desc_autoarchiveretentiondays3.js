/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Autoarchiveretentiondays3Inputs */

const en_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`After this many days an archived tab is permanently deleted`)
};

const es_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tras este número de días, una pestaña archivada se elimina definitivamente`)
};

const pt_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Após este número de dias um separador arquivado é eliminado permanentemente`)
};

const fr_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Après ce nombre de jours, un onglet archivé est supprimé définitivement`)
};

const de_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach dieser Anzahl von Tagen wird ein archivierter Tab dauerhaft gelöscht`)
};

const ja_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`この日数を超えたアーカイブタブは完全削除`)
};

const ko_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 일수가 지나면 보관된 탭이 영구 삭제됩니다`)
};

const zh_cn2_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`超过此天数后，归档标签页将被永久删除`)
};

const ru_options_desc_autoarchiveretentiondays3 = /** @type {(inputs: Options_Desc_Autoarchiveretentiondays3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`По истечении этого срока архивная вкладка удаляется навсегда`)
};

/**
* | output |
* | --- |
* | "After this many days an archived tab is permanently deleted" |
*
* @param {Options_Desc_Autoarchiveretentiondays3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_autoarchiveretentiondays3 = /** @type {((inputs?: Options_Desc_Autoarchiveretentiondays3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Autoarchiveretentiondays3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "es") return es_options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "pt") return pt_options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "fr") return fr_options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "de") return de_options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "ja") return ja_options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "ko") return ko_options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_autoarchiveretentiondays3(inputs)
	return ru_options_desc_autoarchiveretentiondays3(inputs)
});
export { options_desc_autoarchiveretentiondays3 as "options_desc_autoArchiveRetentionDays" }