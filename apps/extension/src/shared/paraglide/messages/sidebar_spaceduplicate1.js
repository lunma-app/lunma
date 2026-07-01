/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Spaceduplicate1Inputs */

const en_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`A space named "${i?.name}" already exists.`)
};

const es_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ya existe un espacio llamado "${i?.name}".`)
};

const pt_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Já existe um Espaço com o nome "${i?.name}".`)
};

const fr_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Un espace nommé "${i?.name}" existe déjà.`)
};

const de_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ein Raum namens "${i?.name}" existiert bereits.`)
};

const ja_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`「${i?.name}」という名前のスペースはすでに存在します。`)
};

const ko_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`"${i?.name}" 이름의 스페이스가 이미 존재합니다.`)
};

const zh_cn2_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`名为"${i?.name}"的空间已存在`)
};

const ru_sidebar_spaceduplicate1 = /** @type {(inputs: Sidebar_Spaceduplicate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Пространство с именем «${i?.name}» уже существует.`)
};

/**
* | output |
* | --- |
* | "A space named \"{name}\" already exists." |
*
* @param {Sidebar_Spaceduplicate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceduplicate1 = /** @type {((inputs: Sidebar_Spaceduplicate1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceduplicate1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spaceduplicate1(inputs)
	if (locale === "es") return es_sidebar_spaceduplicate1(inputs)
	if (locale === "pt") return pt_sidebar_spaceduplicate1(inputs)
	if (locale === "fr") return fr_sidebar_spaceduplicate1(inputs)
	if (locale === "de") return de_sidebar_spaceduplicate1(inputs)
	if (locale === "ja") return ja_sidebar_spaceduplicate1(inputs)
	if (locale === "ko") return ko_sidebar_spaceduplicate1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spaceduplicate1(inputs)
	return ru_sidebar_spaceduplicate1(inputs)
});
export { sidebar_spaceduplicate1 as "sidebar_spaceDuplicate" }