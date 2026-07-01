/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ threshold: NonNullable<unknown> }} Sidebar_Autoarchiveexplain2Inputs */

const en_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Temporary tabs left idle for ${i?.threshold} are archived automatically so your workspace stays tidy — restorable for 7 days.`)
};

const es_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Las pestañas temporales inactivas durante ${i?.threshold} se archivan automáticamente para mantener tu espacio ordenado — recuperables durante 7 días.`)
};

const pt_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Os separadores temporários inativos por ${i?.threshold} são arquivados automaticamente para manter o espaço organizado — recuperáveis durante 7 dias.`)
};

const fr_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Les onglets temporaires inactifs depuis ${i?.threshold} sont archivés automatiquement pour garder votre espace de travail ordonné — restaurables pendant 7 jours.`)
};

const de_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Temporäre Tabs, die ${i?.threshold} inaktiv waren, werden automatisch archiviert — bis zu 7 Tage wiederherstellbar.`)
};

const ja_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.threshold} アイドル状態の一時タブは自動的にアーカイブされ、ワークスペースをすっきり保ちます — 7日間復元可能。`)
};

const ko_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.threshold} 동안 유휴 상태인 임시 탭은 자동으로 보관되어 작업 공간이 깔끔하게 유지됩니다 — 7일 동안 복원 가능합니다.`)
};

const zh_cn2_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`闲置超过 ${i?.threshold} 的临时标签页将自动归档，保持工作区整洁 — 7 天内可恢复`)
};

const ru_sidebar_autoarchiveexplain2 = /** @type {(inputs: Sidebar_Autoarchiveexplain2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Временные вкладки, простаивающие ${i?.threshold}, архивируются автоматически — рабочее пространство остаётся опрятным, восстановление доступно 7 дней.`)
};

/**
* | output |
* | --- |
* | "Temporary tabs left idle for {threshold} are archived automatically so your workspace stays tidy — restorable for 7 days." |
*
* @param {Sidebar_Autoarchiveexplain2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchiveexplain2 = /** @type {((inputs: Sidebar_Autoarchiveexplain2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchiveexplain2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchiveexplain2(inputs)
	if (locale === "es") return es_sidebar_autoarchiveexplain2(inputs)
	if (locale === "pt") return pt_sidebar_autoarchiveexplain2(inputs)
	if (locale === "fr") return fr_sidebar_autoarchiveexplain2(inputs)
	if (locale === "de") return de_sidebar_autoarchiveexplain2(inputs)
	if (locale === "ja") return ja_sidebar_autoarchiveexplain2(inputs)
	if (locale === "ko") return ko_sidebar_autoarchiveexplain2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchiveexplain2(inputs)
	return ru_sidebar_autoarchiveexplain2(inputs)
});
export { sidebar_autoarchiveexplain2 as "sidebar_autoArchiveExplain" }