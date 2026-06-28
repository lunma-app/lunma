/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Launcher_Lensunread1Inputs */

const en_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Unread · ${i?.count}`)
};

const es_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Sin leer · ${i?.count}`)
};

const pt_pt2_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Não lidos · ${i?.count}`)
};

const fr_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Non lus · ${i?.count}`)
};

const de_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ungelesen · ${i?.count}`)
};

const ja_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`未読 · ${i?.count}`)
};

const ko_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`읽지 않음 · ${i?.count}`)
};

const zh_cn2_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`未读 · ${i?.count}`)
};

const ru_launcher_lensunread1 = /** @type {(inputs: Launcher_Lensunread1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Непрочитанные · ${i?.count}`)
};

/**
* | output |
* | --- |
* | "Unread · {count}" |
*
* @param {Launcher_Lensunread1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensunread1 = /** @type {((inputs: Launcher_Lensunread1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensunread1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensunread1(inputs)
	if (locale === "es") return es_launcher_lensunread1(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_lensunread1(inputs)
	if (locale === "fr") return fr_launcher_lensunread1(inputs)
	if (locale === "de") return de_launcher_lensunread1(inputs)
	if (locale === "ja") return ja_launcher_lensunread1(inputs)
	if (locale === "ko") return ko_launcher_lensunread1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensunread1(inputs)
	return ru_launcher_lensunread1(inputs)
});
export { launcher_lensunread1 as "launcher_lensUnread" }