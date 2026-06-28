/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spaceeditorconfirmsave3Inputs */

const en_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save changes`)
};

const es_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar cambios`)
};

const pt_pt2_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar alterações`)
};

const fr_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer`)
};

const de_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Änderungen speichern`)
};

const ja_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`変更を保存`)
};

const ko_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`변경 사항 저장`)
};

const zh_cn2_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`保存更改`)
};

const ru_sidebar_spaceeditorconfirmsave3 = /** @type {(inputs: Sidebar_Spaceeditorconfirmsave3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Сохранить изменения`)
};

/**
* | output |
* | --- |
* | "Save changes" |
*
* @param {Sidebar_Spaceeditorconfirmsave3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditorconfirmsave3 = /** @type {((inputs?: Sidebar_Spaceeditorconfirmsave3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditorconfirmsave3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "es") return es_sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "fr") return fr_sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "de") return de_sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "ja") return ja_sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "ko") return ko_sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spaceeditorconfirmsave3(inputs)
	return ru_sidebar_spaceeditorconfirmsave3(inputs)
});
export { sidebar_spaceeditorconfirmsave3 as "sidebar_spaceEditorConfirmSave" }