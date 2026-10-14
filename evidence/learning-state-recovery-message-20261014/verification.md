# Inconsistent learning result recovery message

useLearningLoad preserves the failure code for the current record; LearningLoadNotice provides EN/RU/KK guidance specifically for LEARNING_RECORD_STATE_INVALID. Forms remain disabled on failed reads, preventing an empty replacement from overwriting the record. No automatic repair, deletion or grade downgrade occurs.

Source Electron test now uses a forged checked F01 record and malformed JSON in three advanced records. It asserts four locked forms, specific foundation explanation, retry after explicit fixture restoration, unchanged previous answers and exact saved records. Test and build passed. This is a source-only fixture with isolated database modification; it does not edit user data or prove production package/physical acceptance.
