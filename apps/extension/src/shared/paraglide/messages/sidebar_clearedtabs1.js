/* eslint-disable */
import * as registry from '../registry.js'
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Sidebar_Clearedtabs1Inputs */

const en_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("en", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Cleared ${i?.count} tab`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Cleared ${i?.count} tabs`);
	return /** @type {LocalizedString} */ ("sidebar_clearedTabs");
};

const es_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("es", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} pestaña borrada`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} pestañas borradas`);
	return /** @type {LocalizedString} */ ("sidebar_clearedTabs");
};

const pt_pt2_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("pt-PT", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} separador fechado`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} separadores fechados`);
	return /** @type {LocalizedString} */ ("sidebar_clearedTabs");
};

const fr_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("fr", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} onglet fermé`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} onglets fermés`);
	return /** @type {LocalizedString} */ ("sidebar_clearedTabs");
};

const de_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("de", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} Tab geschlossen`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} Tabs geschlossen`);
	return /** @type {LocalizedString} */ ("sidebar_clearedTabs");
};

const ja_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("ja", i?.count, {});return /** @type {LocalizedString} */ (`${i?.count} 個のタブをクリアしました`)
};

const ko_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("ko", i?.count, {});return /** @type {LocalizedString} */ (`탭 ${i?.count}개를 정리했습니다`)
};

const zh_cn2_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("zh-CN", i?.count, {});return /** @type {LocalizedString} */ (`已清理 ${i?.count} 个标签页`)
};

const ru_sidebar_clearedtabs1 = /** @type {(inputs: Sidebar_Clearedtabs1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("ru", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Очищена ${i?.count} вкладка`);
	if (countPlural === "few") return /** @type {LocalizedString} */ (`Очищено ${i?.count} вкладки`);
	if (countPlural === "many") return /** @type {LocalizedString} */ (`Очищено ${i?.count} вкладок`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Очищено ${i?.count} вкладок`);
	return /** @type {LocalizedString} */ ("sidebar_clearedTabs");
};

/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Cleared {count} tab" |
* | "other" | "Cleared {count} tabs" |
*
* @param {Sidebar_Clearedtabs1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_clearedtabs1 = /** @type {((inputs: Sidebar_Clearedtabs1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Clearedtabs1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_clearedtabs1(inputs)
	if (locale === "es") return es_sidebar_clearedtabs1(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_clearedtabs1(inputs)
	if (locale === "fr") return fr_sidebar_clearedtabs1(inputs)
	if (locale === "de") return de_sidebar_clearedtabs1(inputs)
	if (locale === "ja") return ja_sidebar_clearedtabs1(inputs)
	if (locale === "ko") return ko_sidebar_clearedtabs1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_clearedtabs1(inputs)
	return ru_sidebar_clearedtabs1(inputs)
});
export { sidebar_clearedtabs1 as "sidebar_clearedTabs" }