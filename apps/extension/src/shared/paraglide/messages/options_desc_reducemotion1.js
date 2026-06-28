/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Reducemotion1Inputs */

const en_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hold the drifting glow and ease transitions.`)
};

const es_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detiene el resplandor flotante y suaviza las transiciones.`)
};

const pt_pt2_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imobilize o brilho flutuante e suavize as transições.`)
};

const fr_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fige la lueur et adoucit les transitions.`)
};

const de_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Driftendes Leuchten und Übergänge einschränken.`)
};

const ja_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`漂うグローを抑え、トランジションをシンプルに。`)
};

const ko_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`흐르는 글로우와 전환 효과를 줄입니다.`)
};

const zh_cn2_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`停止漂浮光晕并平滑过渡动画`)
};

const ru_options_desc_reducemotion1 = /** @type {(inputs: Options_Desc_Reducemotion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Убрать плавающее свечение и упростить переходы.`)
};

/**
* | output |
* | --- |
* | "Hold the drifting glow and ease transitions." |
*
* @param {Options_Desc_Reducemotion1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_reducemotion1 = /** @type {((inputs?: Options_Desc_Reducemotion1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Reducemotion1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_reducemotion1(inputs)
	if (locale === "es") return es_options_desc_reducemotion1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_desc_reducemotion1(inputs)
	if (locale === "fr") return fr_options_desc_reducemotion1(inputs)
	if (locale === "de") return de_options_desc_reducemotion1(inputs)
	if (locale === "ja") return ja_options_desc_reducemotion1(inputs)
	if (locale === "ko") return ko_options_desc_reducemotion1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_reducemotion1(inputs)
	return ru_options_desc_reducemotion1(inputs)
});
export { options_desc_reducemotion1 as "options_desc_reduceMotion" }