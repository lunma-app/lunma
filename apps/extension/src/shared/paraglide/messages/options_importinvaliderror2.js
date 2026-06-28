/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Importinvaliderror2Inputs */

const en_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid backup file — it may be corrupt or from an incompatible version.`)
};

const es_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo de copia de seguridad inválido — puede estar dañado o ser de una versión incompatible.`)
};

const pt_pt2_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ficheiro inválido — pode estar corrompido ou ser de uma versão incompatível.`)
};

const fr_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de sauvegarde invalide — il est peut-être corrompu ou incompatible.`)
};

const de_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ungültige Backup-Datei — sie könnte beschädigt oder inkompatibel sein.`)
};

const ja_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`無効なバックアップファイル — 破損しているか、互換性のないバージョンです。`)
};

const ko_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`잘못된 백업 파일입니다 — 손상되었거나 호환되지 않는 버전일 수 있습니다.`)
};

const zh_cn2_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`备份文件无效 — 可能已损坏或版本不兼容`)
};

const ru_options_importinvaliderror2 = /** @type {(inputs: Options_Importinvaliderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Некорректный файл резервной копии — возможно, он повреждён или несовместим.`)
};

/**
* | output |
* | --- |
* | "Invalid backup file — it may be corrupt or from an incompatible version." |
*
* @param {Options_Importinvaliderror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importinvaliderror2 = /** @type {((inputs?: Options_Importinvaliderror2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importinvaliderror2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_importinvaliderror2(inputs)
	if (locale === "es") return es_options_importinvaliderror2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_importinvaliderror2(inputs)
	if (locale === "fr") return fr_options_importinvaliderror2(inputs)
	if (locale === "de") return de_options_importinvaliderror2(inputs)
	if (locale === "ja") return ja_options_importinvaliderror2(inputs)
	if (locale === "ko") return ko_options_importinvaliderror2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_importinvaliderror2(inputs)
	return ru_options_importinvaliderror2(inputs)
});
export { options_importinvaliderror2 as "options_importInvalidError" }