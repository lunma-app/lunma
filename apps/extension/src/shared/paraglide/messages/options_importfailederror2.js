/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Importfailederror2Inputs */

const en_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import failed — the file may be corrupt or from an incompatible version.`)
};

const es_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importación fallida — el archivo puede estar dañado o ser de una versión incompatible.`)
};

const pt_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importação falhada — o ficheiro pode estar corrompido ou ser de uma versão incompatível.`)
};

const fr_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importation échouée — le fichier est peut-être corrompu ou incompatible.`)
};

const de_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import fehlgeschlagen — die Datei könnte beschädigt oder inkompatibel sein.`)
};

const ja_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`インポートに失敗しました — ファイルが破損しているか、互換性のないバージョンです。`)
};

const ko_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`가져오기 실패 — 파일이 손상되었거나 호환되지 않는 버전일 수 있습니다.`)
};

const zh_cn2_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`导入失败 — 文件可能已损坏或版本不兼容`)
};

const ru_options_importfailederror2 = /** @type {(inputs: Options_Importfailederror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Импорт не удался — файл может быть повреждён или несовместим.`)
};

/**
* | output |
* | --- |
* | "Import failed — the file may be corrupt or from an incompatible version." |
*
* @param {Options_Importfailederror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importfailederror2 = /** @type {((inputs?: Options_Importfailederror2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importfailederror2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_importfailederror2(inputs)
	if (locale === "es") return es_options_importfailederror2(inputs)
	if (locale === "pt") return pt_options_importfailederror2(inputs)
	if (locale === "fr") return fr_options_importfailederror2(inputs)
	if (locale === "de") return de_options_importfailederror2(inputs)
	if (locale === "ja") return ja_options_importfailederror2(inputs)
	if (locale === "ko") return ko_options_importfailederror2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_importfailederror2(inputs)
	return ru_options_importfailederror2(inputs)
});
export { options_importfailederror2 as "options_importFailedError" }