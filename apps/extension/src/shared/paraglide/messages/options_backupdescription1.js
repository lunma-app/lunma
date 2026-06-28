/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Backupdescription1Inputs */

const en_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Move your Spaces to another machine, or keep a copy.`)
};

const es_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mueve tus espacios a otro equipo o guarda una copia.`)
};

const pt_pt2_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mova os seus Spaces para outra máquina ou guarde uma cópia.`)
};

const fr_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déplacez vos espaces vers un autre appareil, ou gardez une copie.`)
};

const de_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Spaces auf ein anderes Gerät übertragen oder eine Kopie behalten.`)
};

const ja_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`スペースを別のマシンに移動するか、コピーを保存します。`)
};

const ko_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`스페이스를 다른 기기로 이동하거나 복사본을 보관합니다.`)
};

const zh_cn2_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`将空间迁移到其他设备，或保留副本`)
};

const ru_options_backupdescription1 = /** @type {(inputs: Options_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Перенесите пространства на другое устройство или сохраните копию.`)
};

/**
* | output |
* | --- |
* | "Move your Spaces to another machine, or keep a copy." |
*
* @param {Options_Backupdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_backupdescription1 = /** @type {((inputs?: Options_Backupdescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Backupdescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_backupdescription1(inputs)
	if (locale === "es") return es_options_backupdescription1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_backupdescription1(inputs)
	if (locale === "fr") return fr_options_backupdescription1(inputs)
	if (locale === "de") return de_options_backupdescription1(inputs)
	if (locale === "ja") return ja_options_backupdescription1(inputs)
	if (locale === "ko") return ko_options_backupdescription1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_backupdescription1(inputs)
	return ru_options_backupdescription1(inputs)
});
export { options_backupdescription1 as "options_backupDescription" }