


/* lexical grammar */
%lex
/*
nonascii		[\200-\377]
unicode			\\{h}{1,6}[ \t\r\n\f]?
escape			{unicode}|\\[ -~\200-\377]
char			[a-zA-Z0-9-]|{nonascii}|{escape}
any_char		.
*/
%%

\s+                   /* skip whitespace */
"="             return '='
"class"				  return 'kCLASS'
"end"       return 'kEND'
"else"       return 'kELSE'
"case"       return 'kCASE'
"ensure"       return 'kENSURE'
"module"       return 'kMODULE'
"elsif"       return 'kELSIF'
"def"       return 'kDEF'
"rescue"       return 'kRESCUE'
"not"       return 'kNOT'
"then"       return 'kTHEN'
"yield"       return 'kYIELD'
"for"       return 'kFOR'
"self"       return 'kSELF'
"false"       return 'kFALSE'
"retry"       return 'kRETRY'
"return"       return 'kRETURN'
"true"       return 'kTRUE'
"if"       return 'kIF'
"defined?"       return 'kDEFINED'
"super"       return 'kSUPER'
"undef"       return 'kUNDEF'
"break"       return 'kBREAK'
"in"       return 'kIN'
"do"       return 'kDO'
"nil"       return 'kNIL'
"until"       return 'kUNTIL'
"unless"       return 'kUNLESS'
"or"       return 'kOR'
"next"       return 'kNEXT'
"when"       return 'kWHEN'
"redo"       return 'kREDO'
"and"       return 'kAND'
"begin"       return 'kBEGIN'
"__LINE__"       return 'k__LINE__'
"__FILE__"     return 'k__FILE__'
"END"     return 'klEND'
"BEGIN"     return 'klBEGIN'
"while"     return 'kWHILE'
"alias"     return 'kALIAS'

[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"::"				  return '::'
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
"!"                   return '!'
"%"                   return '%'
"("                   return '('
")"                   return ')'
"<"                  	return '<'
">"                  	return '>'
"."						return '.'
">>"					return '>>'
"<<"					return '<<'
"def"					return 'def'
"begin"					return 'begin'
"if"					return 'if'
"end"					return 'end'
"true"					return 'true'
<<EOF>>               return 'EOF'

[a-zA-Z_]\w*                  return 'tIDENTIFIER'
.                     return 'INVALID_SYMBOL'

/lex

/* operator associations and precedence */
%token  kCLASS kMODULE kDEF kUNDEFkBEGIN kRESCUE
%token kENSURE
%token kEND
%token kIF
%token kUNLESS
%token kTHEN
%token kELSIF
%token kELSE
%token kCASE
%token kWHEN
%token kWHILE
%token kUNTIL
%token kFOR
%token kBREAK
%token kNEXT
%token kREDO
%token kRETRY
%token kIN
%token kDO
%token kDO_COND
%token kDO_BLOCK
%token kRETURN
%token kYIELD
%token kSUPER
%token kSELF
%token kNIL
%token kTRUE
%token kFALSE
%token kAND
%token kOR
%token kNOT
%token kIF_MOD
%token kUNLESS_MOD
%token kWHILE_MOD
%token kUNTIL_MOD
%token kRESCUE_MOD
%token kALIAS
%token kDEFINED
%token klBEGIN
%token klEND
%token k__LINE__
%token k__FILE__

%token <id>   tIDENTIFIER tFID tGVAR tIVAR tCONSTANT tCVAR
%token <node> tINTEGER tFLOAT tSTRING_CONTENT
%token <node> tNTH_REF tBACK_REF
%token <num>  tREGEXP_END

%type <node> singleton strings string string1 xstring regexp
%type <node> string_contents xstring_contents string_content
%type <node> words qwords word_list qword_list word
%type <node> literal numeric dsym cpath
%type <node> bodystmt compstmt stmts stmt expr arg primary command command_call method_call
%type <node> expr_value arg_value primary_value
%type <node> if_tail opt_else case_body cases opt_rescue exc_list exc_var opt_ensure
%type <node> args when_args call_args call_args2 open_args paren_args opt_paren_args
%type <node> command_args aref_args opt_block_arg block_arg var_ref var_lhs
%type <node> mrhs superclass block_call block_command
%type <node> f_arglist f_args f_optarg f_opt f_rest_arg f_block_arg opt_f_block_arg
%type <node> assoc_list assocs assoc undef_list backref string_dvar
%type <node> for_var block_var opt_block_var block_par
%type <node> brace_block cmd_brace_block do_block lhs none fitem
%type <node> mlhs mlhs_head mlhs_basic mlhs_entry mlhs_item mlhs_node
%type <id>   fsym variable sym symbol operation operation2 operation3
%type <id>   cname fname op
%type <num>  f_norm_arg f_arg
%token tUPLUS 		/* unary+ */
%token tUMINUS 		/* unary- */
%token tPOW		/* ** */
%token tCMP  		/* <=> */
%token tEQ  		/* == */
%token tEQQ  		/* === */
%token tNEQ  		/* != */
%token tGEQ  		/* >= */
%token tLEQ  		/* <= */
%token tANDOP tOROP	/* && and || */
%token tMATCH tNMATCH	/* =~ and !~ */
%token tDOT2 tDOT3	/* .. and ... */
%token tAREF tASET	/* [] and []= */
%token tLSHFT tRSHFT	/* << and >> */
%token tCOLON2		/* :: */
%token tCOLON3		/* :: at EXPR_BEG */
%token <id> tOP_ASGN	/* +=, -=  etc. */
%token tASSOC		/* => */
%token tLPAREN		/* ( */
%token tLPAREN_ARG	/* ( */
%token tRPAREN		/* ) */
%token tLBRACK		/* [ */
%token tLBRACE		/* { */
%token tLBRACE_ARG	/* { */
%token tSTAR		/* * */
%token tAMPER		/* & */
%token tSYMBEG tSTRING_BEG tXSTRING_BEG tREGEXP_BEG tWORDS_BEG tQWORDS_BEG
%token tSTRING_DBEG tSTRING_DVAR tSTRING_END

/*
 *	precedence table
 */

%nonassoc tLOWEST
%nonassoc tLBRACE_ARG

%nonassoc  kIF_MOD kUNLESS_MOD kWHILE_MOD kUNTIL_MOD
%left  kOR kAND
%right kNOT
%nonassoc kDEFINED
%right '=' tOP_ASGN
%left kRESCUE_MOD
%right '?' ':'
%nonassoc tDOT2 tDOT3
%left  tOROP
%left  tANDOP
%nonassoc  tCMP tEQ tEQQ tNEQ tMATCH tNMATCH
%left  '>' tGEQ '<' tLEQ
%left  '|' '^'
%left  '&'
%left  tLSHFT tRSHFT
%left  '+' '-'
%left  '*' '/' '%'
%right tUMINUS_NUM tUMINUS
%right tPOW
%right '!' '~' tUPLUS

%token tLAST_TOKEN



%start program



%% /* language grammar */


program		:  
		  compstmt
		    
		;
term	:	';'
		| '\n'
		;

terms		: term
		| terms ';' 
		;

bodystmt	: compstmt
		  opt_rescue
		  opt_else
		  opt_ensure
		;

compstmt	: stmts opt_terms
		;

stmts		: none
		| stmt
		    
		| stmts terms stmt
		    
		| error stmt
		    
		;

stmt		: kALIAS fitem  fitem
		    
		| kALIAS tGVAR tGVAR
		    
		| kALIAS tGVAR tBACK_REF
		   
		| kALIAS tGVAR tNTH_REF
		    
		| kUNDEF undef_list
		    
		| stmt kIF_MOD expr_value
		| stmt kUNLESS_MOD expr_value
		| stmt kWHILE_MOD expr_value
		| stmt kUNTIL_MOD expr_value
		| stmt kRESCUE_MOD stmt
		| klBEGIN
		  '{' compstmt '}'
		| klEND '{' compstmt '}'
		| lhs '=' command_call
		| mlhs '=' command_call
		| var_lhs tOP_ASGN command_call
		| primary_value '[' aref_args ']' tOP_ASGN command_call
		| primary_value '.' tIDENTIFIER tOP_ASGN command_call
		| primary_value '.' tCONSTANT tOP_ASGN command_call
		| primary_value tCOLON2 tIDENTIFIER tOP_ASGN command_call
		| backref tOP_ASGN command_call
		| lhs '=' mrhs
		| mlhs '=' arg_value
		| mlhs '=' mrhs

		| expr
		;

expr		: command_call
		| expr kAND expr
		    
		| expr kOR expr
		    
		| kNOT expr
		    
		| '!' command_call
		    
		| arg
		;

expr_value	: expr
		    
		;

command_call	: command
		| block_command
		| kRETURN call_args
		    
		| kBREAK call_args
		    
		| kNEXT call_args
		    
		;

block_command	: block_call
		| block_call '.' operation2 command_args
		    
		| block_call tCOLON2 operation2 command_args
		    
		;

cmd_brace_block	: tLBRACE_ARG
		    
		  opt_block_var 
		  compstmt
		  '}'
		    
		;

command		: operation command_args       %prec tLOWEST
		    
		| operation command_args cmd_brace_block
		    
		| primary_value '.' operation2 command_args	%prec tLOWEST
		    
		| primary_value '.' operation2 command_args cmd_brace_block
		  
		| primary_value tCOLON2 operation2 command_args	%prec tLOWEST
		    
		| primary_value tCOLON2 operation2 command_args cmd_brace_block
		    
		| kSUPER command_args
		    
		| kYIELD command_args
		    
		;

mlhs		: mlhs_basic
		| tLPAREN mlhs_entry ')'
		    
		;

mlhs_entry	: mlhs_basic
		| tLPAREN mlhs_entry ')'
		    
		;

mlhs_basic	: mlhs_head
		    
		| mlhs_head mlhs_item
		    
		| mlhs_head tSTAR mlhs_node
		    
		| mlhs_head tSTAR
		    
		| tSTAR mlhs_node
		    
		| tSTAR
		    
		;

mlhs_item	: mlhs_node
		| tLPAREN mlhs_entry ')'
		    
		;

mlhs_head	: mlhs_item ','
		    
		| mlhs_head mlhs_item ','
		    
		;

mlhs_node	: variable
		    
		| primary_value '[' aref_args ']'
		    
		| primary_value '.' tIDENTIFIER
		    
		| primary_value tCOLON2 tIDENTIFIER
		    
		| primary_value '.' tCONSTANT
		    
		| primary_value tCOLON2 tCONSTANT
		    
		| tCOLON3 tCONSTANT
		    
		| backref
		    
		;

lhs		: variable
		    
		| primary_value '[' aref_args ']'
		    
		| primary_value '.' tIDENTIFIER
		    
		| primary_value tCOLON2 tIDENTIFIER
		    
		| primary_value '.' tCONSTANT
		    
		| primary_value tCOLON2 tCONSTANT
		    
		| tCOLON3 tCONSTANT
		    
		| backref
		    
		;

cname		: tIDENTIFIER
		    
		| tCONSTANT
		;

cpath		: tCOLON3 cname
		    
		| cname
		    
		| primary_value tCOLON2 cname
		    
		;

fname		: tIDENTIFIER
		| tCONSTANT
		| tFID
		| op
		    
		| reswords
		    
		;

fsym		: fname
		| symbol
		;

fitem		: fsym
		    
		| dsym
		;

undef_list	: fitem
		    
		| undef_list ','  fitem
		    
		;

op		: '|'		
		| '^'		
		| '&'		
		| tCMP		
		| tEQ		
		| tEQQ		
		| tMATCH	
		| '>'		
		| tGEQ		
		| '<'		
		| tLEQ		
		| tLSHFT	
		| tRSHFT	
		| '+'		
		| '-'		
		| '*'		
		| tSTAR		
		| '/'		
		| '%'		
		| tPOW		
		| '~'		
		| tUPLUS	
		| tUMINUS	
		| tAREF		
		| tASET		
		| '`'		
		;

reswords	: k__LINE__ | k__FILE__  | klBEGIN | klEND
		| kALIAS | kAND | kBEGIN | kBREAK | kCASE | kCLASS | kDEF
		| kDEFINED | kDO | kELSE | kELSIF | kEND | kENSURE | kFALSE
		| kFOR | kIN | kMODULE | kNEXT | kNIL | kNOT
		| kOR | kREDO | kRESCUE | kRETRY | kRETURN | kSELF | kSUPER
		| kTHEN | kTRUE | kUNDEF | kWHEN | kYIELD
		| kIF | kUNLESS | kWHILE | kUNTIL
		;

arg		: lhs '=' arg
		    
		| lhs '=' arg kRESCUE_MOD arg
		    
		| var_lhs tOP_ASGN arg
		    
		| primary_value '[' aref_args ']' tOP_ASGN arg
		| primary_value '.' tIDENTIFIER tOP_ASGN arg
		| primary_value '.' tCONSTANT tOP_ASGN arg
		| primary_value tCOLON2 tIDENTIFIER tOP_ASGN arg
		| primary_value tCOLON2 tCONSTANT tOP_ASGN arg
		    
		| tCOLON3 tCONSTANT tOP_ASGN arg
		    
		| backref tOP_ASGN arg
		    
		| arg tDOT2 arg
		| arg tDOT3 arg
		   
		| arg '+' arg
		    
		| arg '-' arg
		    
		| arg '*' arg
		    
		| arg '/' arg
		    
		| arg '%' arg
		    
		| arg tPOW arg
		    
		| tUMINUS_NUM tINTEGER tPOW arg
		    
		| tUMINUS_NUM tFLOAT tPOW arg
		    
		| tUPLUS arg
		    
		
		| tUMINUS arg
		    
		| arg '|' arg
		    
		| arg '^' arg
		    
		| arg '&' arg
		    
		| arg tCMP arg
		    
		| arg '>' arg
		    
		| arg tGEQ arg
		    
		| arg '<' arg
		    
		| arg tLEQ arg
		    
		| arg tEQ arg
		    
		| arg tEQQ arg
		    
		| arg tNEQ arg
		    
		| arg tMATCH arg
		    
		| arg tNMATCH arg
		    
		| '!' arg
		    
		| '~' arg
		    
		| arg tLSHFT arg
		    
		| arg tRSHFT arg
		    
		| arg tANDOP arg
		    
		| arg tOROP arg
		    
		| kDEFINED opt_nl  arg
		    
		| arg '?' arg ':' arg
		    
		| primary
		    
		;

arg_value	: arg
		    
		;

aref_args	: none
		| command opt_nl
		    
		| args trailer
		    
		| args ',' tSTAR arg opt_nl
		    
		| assocs trailer
		    
		| tSTAR arg opt_nl
		    
		;

paren_args	: '(' none ')'
		    
		| '(' call_args opt_nl ')'
		    
		| '(' block_call opt_nl ')'
		    
		| '(' args ',' block_call opt_nl ')'
		    
		;

opt_paren_args	: none
		| paren_args
		;

call_args	: command
		    
		| args opt_block_arg
		    
		| args ',' tSTAR arg_value opt_block_arg
		    
		| assocs opt_block_arg
		    
		| assocs ',' tSTAR arg_value opt_block_arg
		    
		| args ',' assocs opt_block_arg
		    
		| args ',' assocs ',' tSTAR arg opt_block_arg
		    
		| tSTAR arg_value opt_block_arg
		    
		| block_arg
		;

call_args2	: arg_value ',' args opt_block_arg
		    
		| arg_value ',' block_arg
		    
		| arg_value ',' tSTAR arg_value opt_block_arg
		    
		| arg_value ',' args ',' tSTAR arg_value opt_block_arg
		    
		| assocs opt_block_arg
		    
		| assocs ',' tSTAR arg_value opt_block_arg
		    
		| arg_value ',' assocs opt_block_arg
		    
		| arg_value ',' args ',' assocs opt_block_arg
		    
		| arg_value ',' assocs ',' tSTAR arg_value opt_block_arg
		    
		| arg_value ',' args ',' assocs ',' tSTAR arg_value opt_block_arg
		    
		| tSTAR arg_value opt_block_arg
		    
		| block_arg
		;

command_args	:  
		  open_args
		    
		;

open_args	: call_args
		| tLPAREN_ARG   ')'
		    
		| tLPAREN_ARG call_args2  ')'
		    
		;

block_arg	: tAMPER arg_value
		    
		;

opt_block_arg	: ',' block_arg
		    
		| none
		;

args 		: arg_value
		    
		| args ',' arg_value
		    
		;

mrhs		: args ',' arg_value
		    
		| args ',' tSTAR arg_value
		    
		| tSTAR arg_value
		    
		;

primary		: literal
		| strings
		| xstring
		| regexp
		| words
		| qwords
		| var_ref
		| backref
		| tFID
		    
		| kBEGIN
		 
		| tLPAREN_ARG expr  opt_nl ')'
		    
		| tLPAREN compstmt ')'
		    
		| primary_value tCOLON2 tCONSTANT
		    
		| tCOLON3 tCONSTANT
		    
		| primary_value '[' aref_args ']'
		    
		| tLBRACK aref_args ']'
		| tLBRACE assoc_list '}'
		    
		| kRETURN
		    
		| kYIELD '(' call_args ')'
		    
		| kYIELD '(' ')'
		    
		| kYIELD
		    
		| kDEFINED opt_nl '('  expr ')'
		    
		| operation brace_block
		    
		| method_call
		| method_call brace_block
		| kIF expr_value then
		  compstmt
		  if_tail
		  kEND
		| kUNLESS expr_value then
		  compstmt
		  opt_else
		  kEND
		| kWHILE  expr_value do 
		  compstmt
		  kEND
		| kUNTIL  expr_value do 
		  compstmt
		  kEND
		| kCASE expr_value opt_terms
		  case_body
		  kEND
		| kCASE opt_terms case_body kEND
		    
		| kCASE opt_terms kELSE compstmt kEND
		    
		| kFOR for_var kIN  expr_value do 
		  compstmt
		  kEND
		    
		| kCLASS cpath superclass
		    
		  bodystmt
		  kEND
		    
		| kCLASS tLSHFT expr
		  term
		  bodystmt
		  kEND
		    
		| kMODULE cpath
		    
		  bodystmt
		  kEND
		    
		| kDEF fname
		    
		  f_arglist
		  bodystmt
		  kEND
		    
		| kDEF singleton dot_or_colon  fname
		    
		  f_arglist
		  bodystmt
		  kEND
		    
		| kBREAK
		    
		| kNEXT
		    
		| kREDO
		    
		| kRETRY
		    
		;

primary_value 	: primary
		    
		;

then		: term
		| ':'
		| kTHEN
		| term kTHEN
		;

do		: term
		| ':'
		| kDO_COND
		;

if_tail		: opt_else
		| kELSIF expr_value then
		  compstmt
		  if_tail
		    
		;

opt_else	: none
		| kELSE compstmt
		    
		;

for_var 	: lhs
		| mlhs
		;

block_par	: mlhs_item
		    
		| block_par ',' mlhs_item
		    
		;

block_var	: block_par
		| block_par ','
		    
		| block_par ',' tAMPER lhs
		    
		| block_par ',' tSTAR lhs ',' tAMPER lhs
		    
		| block_par ',' tSTAR ',' tAMPER lhs
		    
		| block_par ',' tSTAR lhs
		    
		| block_par ',' tSTAR
		    
		| tSTAR lhs ',' tAMPER lhs
		    
		| tSTAR ',' tAMPER lhs
		    
		| tSTAR lhs
		    
		| tSTAR
		    
		| tAMPER lhs
		    
		;

opt_block_var	: none
		| '|' /* none */ '|'
		    
		| tOROP
		    
		| '|' block_var '|'
		    
		;

do_block	: kDO_BLOCK
		    
		  opt_block_var 
		  compstmt
		  kEND
		    
		;

block_call	: command do_block
		| block_call '.' operation2 opt_paren_args
		    
		| block_call tCOLON2 operation2 opt_paren_args
		    
		;

method_call	: operation paren_args
		    
		| primary_value '.' operation2 opt_paren_args
		    
		| primary_value tCOLON2 operation2 paren_args
		    
		| primary_value tCOLON2 operation3
		    
		| kSUPER paren_args
		    
		| kSUPER
		    
		;

brace_block	: ''
		    
		| kDO
		    
		  opt_block_var 
		  compstmt kEND
		    
		;

case_body	: kWHEN when_args then
		  compstmt
		  cases
		    
		;
when_args	: args
		| args ',' tSTAR arg_value
		    
		| tSTAR arg_value
		    
		;

cases		: opt_else
		| case_body
		;

opt_rescue	: kRESCUE exc_list exc_var then
		  compstmt
		  opt_rescue
		| none
		;

exc_list	: arg_value
		    
		| mrhs
		| none
		;

exc_var		: tASSOC lhs
		    
		| none
		;

opt_ensure	: kENSURE compstmt
		    
		| none
		;

literal		: numeric
		| symbol
		    
		| dsym
		;

strings		: string
		;

string		: string1
		| string string1
		    
		;

string1		: tSTRING_BEG string_contents tSTRING_END
		    
		;

xstring		: tXSTRING_BEG xstring_contents tSTRING_END
		;

regexp		: tREGEXP_BEG xstring_contents tREGEXP_END
		;

words		: tWORDS_BEG ' ' tSTRING_END
		    
		| tWORDS_BEG word_list tSTRING_END
		    
		;

word_list	: /* none */
		    
		| word_list word ' '
		    
		;

word		: string_content
		| word string_content
		    
		;

qwords		: tQWORDS_BEG ' ' tSTRING_END
		    
		| tQWORDS_BEG qword_list tSTRING_END
		    
		;

qword_list	: /* none */
		    
		| qword_list tSTRING_CONTENT ' '
		    
		;

string_contents : /* none */
		    
		| string_contents string_content
		    
		;

xstring_contents: /* none */
		    
		| xstring_contents string_content
		    
		;

string_content	: tSTRING_CONTENT
		| tSTRING_DVAR
		    
		  string_dvar
		    
		| tSTRING_DBEG
		    
		  compstmt '}'
		;

string_dvar	: tGVAR 
		| tIVAR 
		| tCVAR 
		| backref
		;

symbol		: tSYMBEG sym
		    
		;

sym		: fname
		| tIVAR
		| tGVAR
		| tCVAR
		;

dsym		: tSYMBEG xstring_contents tSTRING_END
		;

numeric		: tINTEGER
		| tFLOAT
		| tUMINUS_NUM tINTEGER	       %prec tLOWEST
		    
		| tUMINUS_NUM tFLOAT	       %prec tLOWEST
		    
		;

variable	: tIDENTIFIER
		| tIVAR
		| tGVAR
		| tCONSTANT
		| tCVAR
		| kNIL 
		| kSELF 
		| kTRUE 
		| kFALSE 
		| k__FILE__ 
		| k__LINE__ 
		;

var_ref		: variable
		    
		;

var_lhs		: variable
		    
		;

backref		: tNTH_REF
		| tBACK_REF
		;

superclass	: term
		    
		| '<'
		    
		  expr_value term
		    
		| error term 
		;

f_arglist	: '(' f_args opt_nl ')'
		    
		| f_args term
		    
		;

f_args		: f_arg ',' f_optarg ',' f_rest_arg opt_f_block_arg
		    
		| f_arg ',' f_optarg opt_f_block_arg
		    
		| f_arg ',' f_rest_arg opt_f_block_arg
		    
		| f_arg opt_f_block_arg
		    
		| f_optarg ',' f_rest_arg opt_f_block_arg
		    
		| f_optarg opt_f_block_arg
		    
		| f_rest_arg opt_f_block_arg
		    
		| f_block_arg
		    
		| /* none */
		    
		;

f_norm_arg	: tCONSTANT
		    
                | tIVAR
		    
                | tGVAR
		    
                | tCVAR
		    
		| tIDENTIFIER
		    
		;

f_arg		: f_norm_arg
		| f_arg ',' f_norm_arg
		    
		;

f_opt		: tIDENTIFIER '=' arg_value
		    
		;

f_optarg	: f_opt
		    
		| f_optarg ',' f_opt
		    
		;

restarg_mark	: '*'
		| tSTAR
		;

f_rest_arg	: restarg_mark tIDENTIFIER
		| restarg_mark
		;

blkarg_mark	: '&'
		| tAMPER
		;

f_block_arg	: blkarg_mark tIDENTIFIER
		;

opt_f_block_arg	: ',' f_block_arg
		    
		| none
		;

singleton	: var_ref
		    
		| '('  expr opt_nl ')'
		;

assoc_list	: none
		| assocs trailer
		    
		| args trailer
		   
		;

assocs		: assoc
		| assocs ',' assoc
		    
		;

assoc		: arg_value tASSOC arg_value
		    
		;

operation	: tIDENTIFIER
		| tCONSTANT
		| tFID
		;

operation2	: tIDENTIFIER
		| tCONSTANT
		| tFID
		| op
		;

operation3	: tIDENTIFIER
		| tFID
		| op
		;

dot_or_colon	: '.'
		| tCOLON2
		;

opt_terms	: /* none */
		| terms
		;

opt_nl		: /* none */
		| '\n'
		;

trailer		: /* none */
		| '\n'
		| ','
		;
none		: /* none */ 
		;
