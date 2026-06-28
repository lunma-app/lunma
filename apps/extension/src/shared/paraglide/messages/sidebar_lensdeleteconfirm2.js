/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensdeleteconfirm2Inputs */

const en_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete — confirm`)
};

const es_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar — confirmar`)
};

const pt_pt2_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar — confirmar`)
};

const fr_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer — confirmer`)
};

const de_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Löschen — bestätigen`)
};

const ja_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`削除 — 確認`)
};

const ko_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`삭제 — 확인`)
};

const zh_cn2_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`删除 — 确认`)
};

const ru_sidebar_lensdeleteconfirm2 = /** @type {(inputs: Sidebar_Lensdeleteconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Удалить — подтвердить`)
};

/**
* | output |
* | --- |
* | "Delete — confirm" |
*
* @param {Sidebar_Lensdeleteconfirm2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensdeleteconfirm2 = /** @type {((inputs?: Sidebar_Lensdeleteconfirm2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensdeleteconfirm2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensdeleteconfirm2(inputs)
	if (locale === "es") return es_sidebar_lensdeleteconfirm2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensdeleteconfirm2(inputs)
	if (locale === "fr") return fr_sidebar_lensdeleteconfirm2(inputs)
	if (locale === "de") return de_sidebar_lensdeleteconfirm2(inputs)
	if (locale === "ja") return ja_sidebar_lensdeleteconfirm2(inputs)
	if (locale === "ko") return ko_sidebar_lensdeleteconfirm2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensdeleteconfirm2(inputs)
	return ru_sidebar_lensdeleteconfirm2(inputs)
});
export { sidebar_lensdeleteconfirm2 as "sidebar_lensDeleteConfirm" }