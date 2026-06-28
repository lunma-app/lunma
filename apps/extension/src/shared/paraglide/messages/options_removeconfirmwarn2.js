/* eslint-disable */
import * as registry from '../registry.js'
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Options_Removeconfirmwarn2Inputs */

const en_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("en", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Still used in ${i?.count} lens — those sections will show "account removed".`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Still used in ${i?.count} lenses — those sections will show "account removed".`);
	return /** @type {LocalizedString} */ ("options_removeConfirmWarn");
};

const es_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("es", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Aún en uso en ${i?.count} lente — esas secciones mostrarán "cuenta eliminada".`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Aún en uso en ${i?.count} lentes — esas secciones mostrarán "cuenta eliminada".`);
	return /** @type {LocalizedString} */ ("options_removeConfirmWarn");
};

const pt_pt2_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("pt-PT", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Ainda usado em ${i?.count} lens — essas secções mostrarão "conta removida".`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Ainda usado em ${i?.count} lenses — essas secções mostrarão "conta removida".`);
	return /** @type {LocalizedString} */ ("options_removeConfirmWarn");
};

const fr_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("fr", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Toujours utilisé dans ${i?.count} vue — ces sections afficheront « compte supprimé ».`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Toujours utilisé dans ${i?.count} vues — ces sections afficheront « compte supprimé ».`);
	return /** @type {LocalizedString} */ ("options_removeConfirmWarn");
};

const de_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("de", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Noch in ${i?.count} Lens verwendet — diese Bereiche zeigen dann "Konto entfernt".`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Noch in ${i?.count} Lenses verwendet — diese Bereiche zeigen dann "Konto entfernt".`);
	return /** @type {LocalizedString} */ ("options_removeConfirmWarn");
};

const ja_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("ja", i?.count, {});return /** @type {LocalizedString} */ (`${i?.count} 個のレンズで使用中 — それらのセクションには「アカウント削除済み」と表示されます。`)
};

const ko_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("ko", i?.count, {});return /** @type {LocalizedString} */ (`렌즈 ${i?.count}개에서 아직 사용 중 — 해당 섹션에 "계정이 삭제됨"이 표시됩니다.`)
};

const zh_cn2_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("zh-CN", i?.count, {});return /** @type {LocalizedString} */ (`仍用于 ${i?.count} 个镜头 — 相关板块将显示"账户已移除"`)
};

const ru_options_removeconfirmwarn2 = /** @type {(inputs: Options_Removeconfirmwarn2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("ru", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Ещё используется в ${i?.count} линзе — в этих разделах появится «аккаунт удалён».`);
	if (countPlural === "few") return /** @type {LocalizedString} */ (`Ещё используется в ${i?.count} линзах — в этих разделах появится «аккаунт удалён».`);
	if (countPlural === "many") return /** @type {LocalizedString} */ (`Ещё используется в ${i?.count} линзах — в этих разделах появится «аккаунт удалён».`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Ещё используется в ${i?.count} линзах — в этих разделах появится «аккаунт удалён».`);
	return /** @type {LocalizedString} */ ("options_removeConfirmWarn");
};

/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Still used in {count} lens — those sections will show \"account removed\"." |
* | "other" | "Still used in {count} lenses — those sections will show \"account removed\"." |
*
* @param {Options_Removeconfirmwarn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_removeconfirmwarn2 = /** @type {((inputs: Options_Removeconfirmwarn2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Removeconfirmwarn2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_removeconfirmwarn2(inputs)
	if (locale === "es") return es_options_removeconfirmwarn2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_removeconfirmwarn2(inputs)
	if (locale === "fr") return fr_options_removeconfirmwarn2(inputs)
	if (locale === "de") return de_options_removeconfirmwarn2(inputs)
	if (locale === "ja") return ja_options_removeconfirmwarn2(inputs)
	if (locale === "ko") return ko_options_removeconfirmwarn2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_removeconfirmwarn2(inputs)
	return ru_options_removeconfirmwarn2(inputs)
});
export { options_removeconfirmwarn2 as "options_removeConfirmWarn" }