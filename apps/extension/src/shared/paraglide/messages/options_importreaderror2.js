/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Importreaderror2Inputs */

const en_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not read the backup file.`)
};

const es_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo leer el archivo de copia de seguridad.`)
};

const pt_pt2_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Não foi possível ler o ficheiro de cópia de segurança.`)
};

const fr_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de lire le fichier de sauvegarde.`)
};

const de_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Die Backup-Datei konnte nicht gelesen werden.`)
};

const ja_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`バックアップファイルを読み込めませんでした。`)
};

const ko_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`백업 파일을 읽을 수 없습니다.`)
};

const zh_cn2_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`无法读取备份文件`)
};

const ru_options_importreaderror2 = /** @type {(inputs: Options_Importreaderror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Не удалось прочитать файл резервной копии.`)
};

/**
* | output |
* | --- |
* | "Could not read the backup file." |
*
* @param {Options_Importreaderror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importreaderror2 = /** @type {((inputs?: Options_Importreaderror2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importreaderror2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_importreaderror2(inputs)
	if (locale === "es") return es_options_importreaderror2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_importreaderror2(inputs)
	if (locale === "fr") return fr_options_importreaderror2(inputs)
	if (locale === "de") return de_options_importreaderror2(inputs)
	if (locale === "ja") return ja_options_importreaderror2(inputs)
	if (locale === "ko") return ko_options_importreaderror2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_importreaderror2(inputs)
	return ru_options_importreaderror2(inputs)
});
export { options_importreaderror2 as "options_importReadError" }