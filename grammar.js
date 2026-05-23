module.exports = grammar({
  name: 'asn1',

  extras: $ => [
    /[ \t\n\r\f\v\x17\x18\x19\x1a]+/,
    $.comment,
  ],

  word: $ => $.identifier_string,

  conflicts: $ => [
    [$.bit_or_object_identifier_value, $.bit_value],
  ],

  rules: {
    source_file: $ => repeat1($.module_definition),

    comment: _ => token(/--([^\n\r-]|-[^\n\r-])*(--|-?[\n\r])/),

    binary_string: _ => token(/'[0-1]*'[Bb]/),
    hexadecimal_string: _ => token(/'[0-9A-Fa-f]*'[Hh]/),
    quoted_string: _ => token(/"([^"]|"")*"/),
    identifier_string: _ => token(/[a-zA-Z][a-zA-Z0-9-_]*/),
    number_string: _ => token(/[0-9]+/),

    module_definition: $ => seq(
      $.module_identifier,
      'DEFINITIONS',
      optional($.tag_default),
      '::=',
      'BEGIN',
      optional($.module_body),
      'END',
    ),

    module_identifier: $ => seq(
      $.identifier_string,
      optional($.object_identifier_value),
    ),

    module_reference: $ => seq($.identifier_string, '.'),

    tag_default: _ => choice(
      seq('EXPLICIT', 'TAGS'),
      seq('IMPLICIT', 'TAGS'),
    ),

    module_body: $ => seq(
      optional($.export_list),
      optional($.import_list),
      $.assignment_list,
    ),

    export_list: $ => seq('EXPORTS', optional($.symbol_list), ';'),

    import_list: $ => seq('IMPORTS', repeat($.symbols_from_module), ';'),

    symbols_from_module: $ => seq($.symbol_list, 'FROM', $.module_identifier),

    symbol_list: $ => commaSep1($.symbol),

    symbol: $ => choice(
      $.identifier_string,
      $.defined_macro_name,
    ),

    assignment_list: $ => repeat1($.assignment),

    assignment: $ => seq(
      choice($.macro_definition, $.type_assignment, $.value_assignment),
      optional(';'),
    ),

    macro_definition: $ => seq($.macro_reference, 'MACRO', '::=', $.macro_body),

    macro_reference: $ => choice(
      $.identifier_string,
      $.defined_macro_name,
    ),

    macro_body: $ => choice(
      seq('BEGIN', repeat($.macro_body_element), 'END'),
      seq($.module_reference, $.macro_reference),
    ),

    macro_body_element: $ => choice(
      '(',
      ')',
      '|',
      '::=',
      'INTEGER',
      'REAL',
      'BOOLEAN',
      'NULL',
      'BIT',
      'OCTET',
      'STRING',
      'OBJECT',
      'IDENTIFIER',
      $.identifier_string,
      $.quoted_string,
    ),

    type_assignment: $ => seq($.identifier_string, '::=', $.type),

    type: $ => choice(
      $.builtin_type,
      $.defined_type,
      $.defined_macro_type,
    ),

    defined_type: $ => seq(
      optional($.module_reference),
      $.identifier_string,
      optional($.value_or_constraint_list),
    ),

    builtin_type: $ => choice(
      $.null_type,
      $.boolean_type,
      $.real_type,
      $.integer_type,
      $.object_identifier_type,
      $.string_type,
      $.bit_string_type,
      $.bits_type,
      $.sequence_type,
      $.sequence_of_type,
      $.set_type,
      $.set_of_type,
      $.choice_type,
      $.enumerated_type,
      $.selection_type,
      $.tagged_type,
      $.any_type,
    ),

    null_type: _ => 'NULL',
    boolean_type: _ => 'BOOLEAN',
    real_type: _ => 'REAL',

    integer_type: $ => seq('INTEGER', optional($.value_or_constraint_list)),

    object_identifier_type: _ => seq('OBJECT', 'IDENTIFIER'),

    string_type: $ => seq('OCTET', 'STRING', optional($.constraint_list)),

    bit_string_type: $ => seq('BIT', 'STRING', optional($.value_or_constraint_list)),

    bits_type: $ => seq('BITS', optional($.value_or_constraint_list)),

    sequence_type: $ => seq('SEQUENCE', '{', optional($.element_type_list), '}'),

    sequence_of_type: $ => seq('SEQUENCE', optional($.constraint_list), 'OF', $.type),

    set_type: $ => seq('SET', '{', optional($.element_type_list), '}'),

    set_of_type: $ => seq('SET', optional($.size_constraint), 'OF', $.type),

    choice_type: $ => seq('CHOICE', '{', $.element_type_list, '}'),

    enumerated_type: $ => seq('ENUMERATED', $.named_number_list),

    selection_type: $ => seq($.identifier_string, '<', $.type),

    tagged_type: $ => seq($.tag, optional($.explicit_or_implicit_tag), $.type),

    tag: $ => seq('[', optional($.class), $.number_string, ']'),

    class: _ => choice('UNIVERSAL', 'APPLICATION', 'PRIVATE'),

    explicit_or_implicit_tag: _ => choice('EXPLICIT', 'IMPLICIT'),

    any_type: $ => choice(
      'ANY',
      seq('ANY', 'DEFINED', 'BY', $.identifier_string),
    ),

    element_type_list: $ => commaSep1($.element_type),

    element_type: $ => choice(
      seq(
        optional($.identifier_string),
        $.type,
        optional($.optional_or_default_element),
      ),
      seq(
        optional($.identifier_string),
        'COMPONENTS',
        'OF',
        $.type,
      ),
    ),

    optional_or_default_element: $ => choice(
      'OPTIONAL',
      seq('DEFAULT', optional($.identifier_string), $.value),
    ),

    value_or_constraint_list: $ => choice(
      $.named_number_list,
      $.constraint_list,
    ),

    named_number_list: $ => seq('{', commaSep1($.named_number), '}'),

    named_number: $ => seq($.identifier_string, '(', $.number, ')'),

    number: $ => choice(
      $.number_value,
      $.binary_value,
      $.hexadecimal_value,
      $.defined_value,
    ),

    constraint_list: $ => seq('(', sep1($.constraint, '|'), ')'),

    constraint: $ => choice(
      $.value_constraint,
      $.size_constraint,
      $.alphabet_constraint,
      $.contained_type_constraint,
      $.inner_type_constraint,
    ),

    value_constraint_list: $ => seq('(', sep1($.value_constraint, '|'), ')'),

    value_constraint: $ => seq($.lower_end_point, optional($.value_range)),

    value_range: $ => seq(optional('<'), '..', optional('<'), $.upper_end_point),

    lower_end_point: $ => choice($.value, 'MIN'),
    upper_end_point: $ => choice($.value, 'MAX'),

    size_constraint: $ => seq('SIZE', $.value_constraint_list),

    alphabet_constraint: $ => seq('FROM', $.value_constraint_list),

    contained_type_constraint: $ => seq('INCLUDES', $.type),

    inner_type_constraint: $ => choice(
      seq('WITH', 'COMPONENT', $.value_or_constraint_list),
      seq('WITH', 'COMPONENTS', $.components_list),
    ),

    components_list: $ => choice(
      seq('{', $.component_constraint, repeat($.components_list_tail), '}'),
      seq('{', '...', repeat1($.components_list_tail), '}'),
    ),

    components_list_tail: $ => seq(',', optional($.component_constraint)),

    component_constraint: $ => choice(
      seq($.identifier_string, optional($.component_value_presence)),
      $.component_value_presence,
    ),

    component_value_presence: $ => choice(
      seq($.value_or_constraint_list, optional($.component_presence)),
      $.component_presence,
    ),

    component_presence: _ => choice('PRESENT', 'ABSENT', 'OPTIONAL'),

    value_assignment: $ => seq($.identifier_string, $.type, '::=', $.value),

    value: $ => choice(
      $.builtin_value,
      $.defined_value,
    ),

    defined_value: $ => seq(optional($.module_reference), $.identifier_string),

    builtin_value: $ => choice(
      $.null_value,
      $.boolean_value,
      $.special_real_value,
      $.number_value,
      $.binary_value,
      $.hexadecimal_value,
      $.string_value,
      $.bit_or_object_identifier_value,
    ),

    null_value: _ => 'NULL',

    boolean_value: _ => choice('TRUE', 'FALSE'),

    special_real_value: _ => choice('PLUS-INFINITY', 'MINUS-INFINITY'),

    number_value: $ => seq(optional('-'), $.number_string),

    binary_value: $ => $.binary_string,
    hexadecimal_value: $ => $.hexadecimal_string,
    string_value: $ => $.quoted_string,

    bit_or_object_identifier_value: $ => $.name_value_list,
    bit_value: $ => $.name_value_list,
    object_identifier_value: $ => $.name_value_list,

    name_value_list: $ => seq('{', repeat($.name_value_component), '}'),

    name_value_component: $ => seq(optional(','), $.name_or_number),

    name_or_number: $ => choice(
      $.number_string,
      $.identifier_string,
      $.name_and_number,
    ),

    name_and_number: $ => choice(
      seq($.identifier_string, '(', $.number_string, ')'),
      seq($.identifier_string, '(', $.defined_value, ')'),
    ),

    defined_macro_type: $ => choice(
      $.snmp_module_identity_macro_type,
      $.snmp_object_identity_macro_type,
      $.snmp_object_type_macro_type,
      $.snmp_notification_type_macro_type,
      $.snmp_trap_type_macro_type,
      $.snmp_textual_convention_macro_type,
      $.snmp_object_group_macro_type,
      $.snmp_notification_group_macro_type,
      $.snmp_module_compliance_macro_type,
      $.snmp_agent_capabilities_macro_type,
    ),

    defined_macro_name: _ => choice(
      'MODULE-IDENTITY',
      'OBJECT-IDENTITY',
      'OBJECT-TYPE',
      'NOTIFICATION-TYPE',
      'TRAP-TYPE',
      'TEXTUAL-CONVENTION',
      'OBJECT-GROUP',
      'NOTIFICATION-GROUP',
      'MODULE-COMPLIANCE',
      'AGENT-CAPABILITIES',
    ),

    snmp_module_identity_macro_type: $ => seq(
      'MODULE-IDENTITY',
      $.snmp_update_part,
      $.snmp_organization_part,
      $.snmp_contact_part,
      $.snmp_descr_part,
      repeat($.snmp_revision_part),
    ),

    snmp_object_identity_macro_type: $ => prec.right(seq(
      'OBJECT-IDENTITY',
      $.snmp_status_part,
      $.snmp_descr_part,
      optional($.snmp_refer_part),
    )),

    snmp_object_type_macro_type: $ => prec.right(seq(
      'OBJECT-TYPE',
      $.snmp_syntax_part,
      optional($.snmp_units_part),
      $.snmp_access_part,
      $.snmp_status_part,
      optional($.snmp_descr_part),
      optional($.snmp_refer_part),
      optional($.snmp_index_part),
      optional($.snmp_def_val_part),
    )),

    snmp_notification_type_macro_type: $ => prec.right(seq(
      'NOTIFICATION-TYPE',
      optional($.snmp_objects_part),
      $.snmp_status_part,
      $.snmp_descr_part,
      optional($.snmp_refer_part),
    )),

    snmp_trap_type_macro_type: $ => prec.right(seq(
      'TRAP-TYPE',
      $.snmp_enterprise_part,
      optional($.snmp_var_part),
      optional($.snmp_descr_part),
      optional($.snmp_refer_part),
    )),

    snmp_textual_convention_macro_type: $ => prec.right(seq(
      'TEXTUAL-CONVENTION',
      optional($.snmp_display_part),
      $.snmp_status_part,
      $.snmp_descr_part,
      optional($.snmp_refer_part),
      $.snmp_syntax_part,
    )),

    snmp_object_group_macro_type: $ => prec.right(seq(
      'OBJECT-GROUP',
      $.snmp_objects_part,
      $.snmp_status_part,
      $.snmp_descr_part,
      optional($.snmp_refer_part),
    )),

    snmp_notification_group_macro_type: $ => prec.right(seq(
      'NOTIFICATION-GROUP',
      $.snmp_notifications_part,
      $.snmp_status_part,
      $.snmp_descr_part,
      optional($.snmp_refer_part),
    )),

    snmp_module_compliance_macro_type: $ => prec.right(seq(
      'MODULE-COMPLIANCE',
      $.snmp_status_part,
      $.snmp_descr_part,
      optional($.snmp_refer_part),
      repeat1($.snmp_module_part),
    )),

    snmp_agent_capabilities_macro_type: $ => prec.right(seq(
      'AGENT-CAPABILITIES',
      $.snmp_product_release_part,
      $.snmp_status_part,
      $.snmp_descr_part,
      optional($.snmp_refer_part),
      repeat($.snmp_module_support_part),
    )),

    snmp_update_part: $ => seq('LAST-UPDATED', $.quoted_string),
    snmp_organization_part: $ => seq('ORGANIZATION', $.quoted_string),
    snmp_contact_part: $ => seq('CONTACT-INFO', $.quoted_string),
    snmp_descr_part: $ => seq('DESCRIPTION', $.quoted_string),

    snmp_revision_part: $ => seq('REVISION', $.value, 'DESCRIPTION', $.quoted_string),

    snmp_status_part: $ => seq('STATUS', $.identifier_string),

    snmp_refer_part: $ => seq('REFERENCE', $.quoted_string),

    snmp_syntax_part: $ => seq('SYNTAX', $.type),

    snmp_units_part: $ => seq('UNITS', $.quoted_string),

    snmp_access_part: $ => choice(
      seq('ACCESS', $.identifier_string),
      seq('MAX-ACCESS', $.identifier_string),
      seq('MIN-ACCESS', $.identifier_string),
    ),

    snmp_index_part: $ => choice(
      seq('INDEX', '{', $.index_value_list, '}'),
      seq('AUGMENTS', '{', $.value, '}'),
    ),

    index_value_list: $ => commaSep1($.index_value),

    index_value: $ => choice(
      $.value,
      seq('IMPLIED', $.value),
      $.index_type,
    ),

    index_type: $ => choice(
      $.integer_type,
      $.string_type,
      $.object_identifier_type,
    ),

    snmp_def_val_part: $ => seq('DEFVAL', '{', $.value, '}'),

    snmp_objects_part: $ => seq('OBJECTS', '{', $.value_list, '}'),

    value_list: $ => commaSep1($.value),

    snmp_enterprise_part: $ => seq('ENTERPRISE', $.value),

    snmp_var_part: $ => seq('VARIABLES', '{', $.value_list, '}'),

    snmp_display_part: $ => seq('DISPLAY-HINT', $.quoted_string),

    snmp_notifications_part: $ => seq('NOTIFICATIONS', '{', $.value_list, '}'),

    snmp_module_part: $ => prec.right(seq(
      'MODULE',
      optional($.snmp_module_import),
      optional($.snmp_mandatory_part),
      repeat($.snmp_compliance_part),
    )),

    snmp_module_import: $ => $.module_identifier,

    snmp_mandatory_part: $ => seq('MANDATORY-GROUPS', '{', $.value_list, '}'),

    snmp_compliance_part: $ => choice(
      $.compliance_group,
      $.compliance_object,
    ),

    compliance_group: $ => seq('GROUP', $.value, $.snmp_descr_part),

    compliance_object: $ => prec.right(seq(
      'OBJECT',
      $.value,
      optional($.snmp_syntax_part),
      optional($.snmp_write_syntax_part),
      optional($.snmp_access_part),
      $.snmp_descr_part,
    )),

    snmp_write_syntax_part: $ => seq('WRITE-SYNTAX', $.type),

    snmp_product_release_part: $ => seq('PRODUCT-RELEASE', $.quoted_string),

    snmp_module_support_part: $ => prec.right(seq(
      'SUPPORTS',
      $.snmp_module_import,
      'INCLUDES',
      '{',
      $.value_list,
      '}',
      repeat($.snmp_variation_part),
    )),

    snmp_variation_part: $ => prec.right(seq(
      'VARIATION',
      $.value,
      optional($.snmp_syntax_part),
      optional($.snmp_write_syntax_part),
      optional($.snmp_access_part),
      optional($.snmp_creation_part),
      optional($.snmp_def_val_part),
      $.snmp_descr_part,
    )),

    snmp_creation_part: $ => seq('CREATION-REQUIRES', '{', $.value_list, '}'),
  },
});

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

function commaSep1(rule) {
  return sep1(rule, ',');
}