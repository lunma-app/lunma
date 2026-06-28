/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Deletespaceconfirm2Inputs */

const en_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure? This will remove the space and unpin all its tabs.`)
};

const es_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro? Se eliminará el espacio y se desfijarán todas sus pestañas.`)
};

const pt_pt2_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tem a certeza? Isto irá remover o Space e desafixar todos os seus separadores.`)
};

const fr_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sûr(e) ? Cela supprimera l'espace et désépinglera tous ses onglets.`)
};

const de_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sicher? Der Space wird entfernt und alle Tabs werden gelöst.`)
};

const ja_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`本当によろしいですか？スペースを削除し、固定タブをすべて解除します。`)
};

const ko_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`정말 삭제하시겠습니까? 스페이스가 제거되고 모든 탭의 고정이 해제됩니다.`)
};

const zh_cn2_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`确定？这将删除该空间并取消固定其所有标签页`)
};

const ru_sidebar_deletespaceconfirm2 = /** @type {(inputs: Sidebar_Deletespaceconfirm2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Вы уверены? Это удалит пространство и открепит все его вкладки.`)
};

/**
* | output |
* | --- |
* | "Are you sure? This will remove the space and unpin all its tabs." |
*
* @param {Sidebar_Deletespaceconfirm2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_deletespaceconfirm2 = /** @type {((inputs?: Sidebar_Deletespaceconfirm2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Deletespaceconfirm2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_deletespaceconfirm2(inputs)
	if (locale === "es") return es_sidebar_deletespaceconfirm2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_deletespaceconfirm2(inputs)
	if (locale === "fr") return fr_sidebar_deletespaceconfirm2(inputs)
	if (locale === "de") return de_sidebar_deletespaceconfirm2(inputs)
	if (locale === "ja") return ja_sidebar_deletespaceconfirm2(inputs)
	if (locale === "ko") return ko_sidebar_deletespaceconfirm2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_deletespaceconfirm2(inputs)
	return ru_sidebar_deletespaceconfirm2(inputs)
});
export { sidebar_deletespaceconfirm2 as "sidebar_deleteSpaceConfirm" }