/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Importconfirm1Inputs */

const en_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace your data? This cannot be undone.`)
};

const es_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Reemplazar tus datos? Esta acción no se puede deshacer.`)
};

const pt_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Substituir os seus dados? Esta ação não pode ser anulada.`)
};

const fr_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplacer vos données ? Cette action est irréversible.`)
};

const de_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Daten ersetzen? Dies kann nicht rückgängig gemacht werden.`)
};

const ja_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`データを置き換えますか？この操作は元に戻せません。`)
};

const ko_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`데이터를 교체하시겠습니까? 이 작업은 취소할 수 없습니다.`)
};

const zh_cn2_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`替换您的数据？此操作不可撤销`)
};

const ru_options_importconfirm1 = /** @type {(inputs: Options_Importconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Заменить данные? Это невозможно отменить.`)
};

/**
* | output |
* | --- |
* | "Replace your data? This cannot be undone." |
*
* @param {Options_Importconfirm1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importconfirm1 = /** @type {((inputs?: Options_Importconfirm1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importconfirm1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_importconfirm1(inputs)
	if (locale === "es") return es_options_importconfirm1(inputs)
	if (locale === "pt") return pt_options_importconfirm1(inputs)
	if (locale === "fr") return fr_options_importconfirm1(inputs)
	if (locale === "de") return de_options_importconfirm1(inputs)
	if (locale === "ja") return ja_options_importconfirm1(inputs)
	if (locale === "ko") return ko_options_importconfirm1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_importconfirm1(inputs)
	return ru_options_importconfirm1(inputs)
});
export { options_importconfirm1 as "options_importConfirm" }