/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Exportbackup1Inputs */

const en_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Export backup`)
};

const es_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportar copia de seguridad`)
};

const pt_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportar cópia de segurança`)
};

const fr_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exporter la sauvegarde`)
};

const de_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup exportieren`)
};

const ja_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`バックアップをエクスポート`)
};

const ko_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`백업 내보내기`)
};

const zh_cn2_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`导出备份`)
};

const ru_options_exportbackup1 = /** @type {(inputs: Options_Exportbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Экспортировать резервную копию`)
};

/**
* | output |
* | --- |
* | "Export backup" |
*
* @param {Options_Exportbackup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_exportbackup1 = /** @type {((inputs?: Options_Exportbackup1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Exportbackup1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_exportbackup1(inputs)
	if (locale === "es") return es_options_exportbackup1(inputs)
	if (locale === "pt") return pt_options_exportbackup1(inputs)
	if (locale === "fr") return fr_options_exportbackup1(inputs)
	if (locale === "de") return de_options_exportbackup1(inputs)
	if (locale === "ja") return ja_options_exportbackup1(inputs)
	if (locale === "ko") return ko_options_exportbackup1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_exportbackup1(inputs)
	return ru_options_exportbackup1(inputs)
});
export { options_exportbackup1 as "options_exportBackup" }