/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Lensaccountremoved2Inputs */

const en_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Account removed — reconnect or pick another`)
};

const es_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuenta eliminada — reconecta o elige otra`)
};

const pt_pt2_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conta removida — reconectar ou escolher outra`)
};

const fr_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compte supprimé — reconnectez-vous ou choisissez-en un autre`)
};

const de_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Konto entfernt — erneut verbinden oder ein anderes wählen`)
};

const ja_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アカウントが削除されました — 再接続するか別のアカウントを選択`)
};

const ko_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정이 삭제됨 — 재연결하거나 다른 계정 선택`)
};

const zh_cn2_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`账户已移除 — 重新连接或选择其他账户`)
};

const ru_sidebar_lensaccountremoved2 = /** @type {(inputs: Sidebar_Lensaccountremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Аккаунт удалён — переподключитесь или выберите другой`)
};

/**
* | output |
* | --- |
* | "Account removed — reconnect or pick another" |
*
* @param {Sidebar_Lensaccountremoved2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensaccountremoved2 = /** @type {((inputs?: Sidebar_Lensaccountremoved2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensaccountremoved2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_lensaccountremoved2(inputs)
	if (locale === "es") return es_sidebar_lensaccountremoved2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_lensaccountremoved2(inputs)
	if (locale === "fr") return fr_sidebar_lensaccountremoved2(inputs)
	if (locale === "de") return de_sidebar_lensaccountremoved2(inputs)
	if (locale === "ja") return ja_sidebar_lensaccountremoved2(inputs)
	if (locale === "ko") return ko_sidebar_lensaccountremoved2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_lensaccountremoved2(inputs)
	return ru_sidebar_lensaccountremoved2(inputs)
});
export { sidebar_lensaccountremoved2 as "sidebar_lensAccountRemoved" }