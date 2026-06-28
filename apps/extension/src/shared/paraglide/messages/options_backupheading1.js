/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Backupheading1Inputs */

const en_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup & restore`)
};

const es_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia de seguridad y restauración`)
};

const pt_pt2_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cópia de segurança e restauro`)
};

const fr_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarde & restauration`)
};

const de_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup & Wiederherstellung`)
};

const ja_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`バックアップと復元`)
};

const ko_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`백업 및 복원`)
};

const zh_cn2_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`备份与恢复`)
};

const ru_options_backupheading1 = /** @type {(inputs: Options_Backupheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Резервное копирование`)
};

/**
* | output |
* | --- |
* | "Backup & restore" |
*
* @param {Options_Backupheading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_backupheading1 = /** @type {((inputs?: Options_Backupheading1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Backupheading1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_backupheading1(inputs)
	if (locale === "es") return es_options_backupheading1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_backupheading1(inputs)
	if (locale === "fr") return fr_options_backupheading1(inputs)
	if (locale === "de") return de_options_backupheading1(inputs)
	if (locale === "ja") return ja_options_backupheading1(inputs)
	if (locale === "ko") return ko_options_backupheading1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_backupheading1(inputs)
	return ru_options_backupheading1(inputs)
});
export { options_backupheading1 as "options_backupHeading" }