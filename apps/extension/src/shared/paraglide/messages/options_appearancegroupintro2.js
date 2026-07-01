/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Appearancegroupintro2Inputs */

const en_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Theme, colour, motion, and density — across every Lunma surface.`)
};

const es_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tema, color, movimiento y densidad — en todas las superficies de Lunma.`)
};

const pt_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tema, cor, movimento e densidade — em todas as superfícies do Lunma.`)
};

const fr_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Thème, couleur, animation et densité — sur toutes les surfaces Lunma.`)
};

const de_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Theme, Farbe, Bewegung und Dichte — auf allen Lunma-Oberflächen.`)
};

const ja_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`テーマ、カラー、モーション、密度 — すべての Lunma 画面。`)
};

const ko_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`테마, 색상, 모션, 밀도 — Lunma의 모든 화면에 적용됩니다.`)
};

const zh_cn2_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`主题、颜色、动效和密度 — 适用于所有 Lunma 界面`)
};

const ru_options_appearancegroupintro2 = /** @type {(inputs: Options_Appearancegroupintro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Тема, цвет, анимация и плотность — на всех поверхностях Lunma.`)
};

/**
* | output |
* | --- |
* | "Theme, colour, motion, and density — across every Lunma surface." |
*
* @param {Options_Appearancegroupintro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_appearancegroupintro2 = /** @type {((inputs?: Options_Appearancegroupintro2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Appearancegroupintro2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_appearancegroupintro2(inputs)
	if (locale === "es") return es_options_appearancegroupintro2(inputs)
	if (locale === "pt") return pt_options_appearancegroupintro2(inputs)
	if (locale === "fr") return fr_options_appearancegroupintro2(inputs)
	if (locale === "de") return de_options_appearancegroupintro2(inputs)
	if (locale === "ja") return ja_options_appearancegroupintro2(inputs)
	if (locale === "ko") return ko_options_appearancegroupintro2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_appearancegroupintro2(inputs)
	return ru_options_appearancegroupintro2(inputs)
});
export { options_appearancegroupintro2 as "options_appearanceGroupIntro" }