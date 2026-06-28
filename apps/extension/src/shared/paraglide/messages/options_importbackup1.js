/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Importbackup1Inputs */

const en_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import backup`)
};

const es_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar copia de seguridad`)
};

const pt_pt2_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar cópia de segurança`)
};

const fr_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer une sauvegarde`)
};

const de_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup importieren`)
};

const ja_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`バックアップをインポート`)
};

const ko_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`백업 가져오기`)
};

const zh_cn2_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`导入备份`)
};

const ru_options_importbackup1 = /** @type {(inputs: Options_Importbackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Импортировать резервную копию`)
};

/**
* | output |
* | --- |
* | "Import backup" |
*
* @param {Options_Importbackup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importbackup1 = /** @type {((inputs?: Options_Importbackup1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importbackup1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_importbackup1(inputs)
	if (locale === "es") return es_options_importbackup1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_importbackup1(inputs)
	if (locale === "fr") return fr_options_importbackup1(inputs)
	if (locale === "de") return de_options_importbackup1(inputs)
	if (locale === "ja") return ja_options_importbackup1(inputs)
	if (locale === "ko") return ko_options_importbackup1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_importbackup1(inputs)
	return ru_options_importbackup1(inputs)
});
export { options_importbackup1 as "options_importBackup" }