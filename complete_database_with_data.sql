--
-- PostgreSQL database dump
--

\restrict 9DCgxvuWFHPidiWrZ5L2WGCYOSEsUiVT0hMmO2fA1pWIDkgdEt8YkeyTY3CARHj

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ensure_single_primary_contact(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.ensure_single_primary_contact() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF NEW.is_primary = true THEN
          UPDATE contacts 
          SET is_primary = false 
          WHERE client_id = NEW.client_id 
            AND id != NEW.id 
            AND is_primary = true;
        END IF;
        RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.ensure_single_primary_contact() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    company character varying(100),
    address text,
    city character varying(50),
    country character varying(50),
    tax_number character varying(50),
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    client_id integer,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100),
    phone character varying(20),
    "position" character varying(100),
    department character varying(100),
    is_primary boolean DEFAULT false,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contacts_id_seq OWNER TO postgres;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    company character varying(100),
    source character varying(50),
    status character varying(20) DEFAULT 'new'::character varying,
    assigned_to integer,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    client_id integer,
    CONSTRAINT leads_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'contacted'::character varying, 'qualified'::character varying, 'lost'::character varying, 'converted'::character varying])::text[])))
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_id_seq OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opportunities (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    client_id integer,
    lead_id integer,
    value numeric(10,2),
    stage character varying(20) DEFAULT 'prospecting'::character varying,
    probability integer,
    expected_close_date date,
    assigned_to integer,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT opportunities_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
    CONSTRAINT opportunities_stage_check CHECK (((stage)::text = ANY ((ARRAY['prospecting'::character varying, 'qualification'::character varying, 'proposal'::character varying, 'negotiation'::character varying, 'closed_won'::character varying, 'closed_lost'::character varying])::text[])))
);


ALTER TABLE public.opportunities OWNER TO postgres;

--
-- Name: opportunities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opportunities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opportunities_id_seq OWNER TO postgres;

--
-- Name: opportunities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opportunities_id_seq OWNED BY public.opportunities.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: product_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_tags (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    color character varying(7) DEFAULT '#3182ce'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_tags OWNER TO postgres;

--
-- Name: product_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_tags_id_seq OWNER TO postgres;

--
-- Name: product_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_tags_id_seq OWNED BY public.product_tags.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    sku character varying(50),
    price numeric(10,2),
    cost numeric(10,2),
    category character varying(50),
    unit character varying(20),
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    product_type character varying(20) DEFAULT 'item'::character varying,
    item_type character varying(50),
    service_unit character varying(50),
    tags text[],
    rate numeric(10,2),
    CONSTRAINT products_product_type_check CHECK (((product_type)::text = ANY ((ARRAY['item'::character varying, 'service'::character varying])::text[])))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    client_id integer,
    status character varying(50) DEFAULT 'active'::character varying,
    priority character varying(20) DEFAULT 'medium'::character varying,
    start_date date,
    due_date date,
    completion_date date,
    budget numeric(12,2),
    actual_cost numeric(12,2),
    project_manager_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: quotation_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_templates (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    is_default boolean DEFAULT false,
    company_name character varying(200),
    company_tagline character varying(200),
    company_address text,
    company_phone character varying(50),
    company_email character varying(100),
    company_website character varying(100),
    company_reg_number character varying(100),
    company_vat_number character varying(100),
    logo_url text,
    primary_color character varying(7) DEFAULT '#8B0000'::character varying,
    secondary_color character varying(7) DEFAULT '#FFFFFF'::character varying,
    accent_color character varying(7) DEFAULT '#000000'::character varying,
    show_logo boolean DEFAULT true,
    show_tagline boolean DEFAULT true,
    show_client_info boolean DEFAULT true,
    show_description boolean DEFAULT true,
    show_terms boolean DEFAULT true,
    show_signature boolean DEFAULT true,
    default_terms text,
    default_notes text,
    vat_rate numeric(5,2) DEFAULT 15.00,
    vat_number character varying(50),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quotation_templates OWNER TO postgres;

--
-- Name: quotation_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotation_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_templates_id_seq OWNER TO postgres;

--
-- Name: quotation_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotation_templates_id_seq OWNED BY public.quotation_templates.id;


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotations (
    id integer NOT NULL,
    quote_number character varying(50) NOT NULL,
    client_id integer,
    opportunity_id integer,
    status character varying(20) DEFAULT 'draft'::character varying,
    valid_until date,
    subtotal numeric(10,2) NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(10,2) DEFAULT 0,
    discount numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    items jsonb NOT NULL,
    notes text,
    terms text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    template_id integer,
    description text,
    prepared_by character varying(100),
    CONSTRAINT quotations_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.quotations OWNER TO postgres;

--
-- Name: quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotations_id_seq OWNER TO postgres;

--
-- Name: quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotations_id_seq OWNED BY public.quotations.id;


--
-- Name: service_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_units (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    abbreviation character varying(20),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.service_units OWNER TO postgres;

--
-- Name: service_units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_units_id_seq OWNER TO postgres;

--
-- Name: service_units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_units_id_seq OWNED BY public.service_units.id;


--
-- Name: task_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_departments (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_departments OWNER TO postgres;

--
-- Name: task_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_departments_id_seq OWNER TO postgres;

--
-- Name: task_departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_departments_id_seq OWNED BY public.task_departments.id;


--
-- Name: task_subcategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_subcategories (
    id integer NOT NULL,
    department_id integer,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_subcategories OWNER TO postgres;

--
-- Name: task_subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_subcategories_id_seq OWNER TO postgres;

--
-- Name: task_subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_subcategories_id_seq OWNED BY public.task_subcategories.id;


--
-- Name: task_team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_team_members (
    id integer NOT NULL,
    task_id integer,
    user_id integer,
    hours_worked numeric(8,2) DEFAULT 0,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_team_members OWNER TO postgres;

--
-- Name: task_team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_team_members_id_seq OWNER TO postgres;

--
-- Name: task_team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_team_members_id_seq OWNED BY public.task_team_members.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    ticket_number character varying(100),
    ticket_url text,
    priority character varying(10) NOT NULL,
    department_id integer,
    subcategory_id integer,
    project_id integer,
    status character varying(50) DEFAULT 'pending'::character varying,
    start_date date,
    due_date date,
    close_date date,
    total_hours numeric(8,2) DEFAULT 0,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    client_id integer
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: tasks_with_status; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.tasks_with_status AS
 SELECT id,
    title,
    description,
    ticket_number,
    ticket_url,
    priority,
    department_id,
    subcategory_id,
    project_id,
    status,
    start_date,
    due_date,
    close_date,
    total_hours,
    created_by,
    created_at,
    updated_at,
        CASE
            WHEN (((status)::text = 'closed'::text) AND (close_date IS NOT NULL) AND (due_date IS NOT NULL)) THEN (close_date > due_date)
            WHEN (((status)::text <> 'closed'::text) AND (due_date IS NOT NULL)) THEN (CURRENT_DATE > due_date)
            ELSE false
        END AS is_overdue
   FROM public.tasks t;


ALTER VIEW public.tasks_with_status OWNER TO postgres;

--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    user_id integer,
    permission_id integer,
    granted_by integer,
    granted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permissions_id_seq OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: opportunities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities ALTER COLUMN id SET DEFAULT nextval('public.opportunities_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: product_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tags ALTER COLUMN id SET DEFAULT nextval('public.product_tags_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: quotation_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates ALTER COLUMN id SET DEFAULT nextval('public.quotation_templates_id_seq'::regclass);


--
-- Name: quotations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations ALTER COLUMN id SET DEFAULT nextval('public.quotations_id_seq'::regclass);


--
-- Name: service_units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_units ALTER COLUMN id SET DEFAULT nextval('public.service_units_id_seq'::regclass);


--
-- Name: task_departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_departments ALTER COLUMN id SET DEFAULT nextval('public.task_departments_id_seq'::regclass);


--
-- Name: task_subcategories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_subcategories ALTER COLUMN id SET DEFAULT nextval('public.task_subcategories_id_seq'::regclass);


--
-- Name: task_team_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_team_members ALTER COLUMN id SET DEFAULT nextval('public.task_team_members_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, name, email, phone, company, address, city, country, tax_number, notes, created_by, created_at, updated_at) FROM stdin;
1	Test	Test@test.com	0123456789	Testers	165 west street	johannesburg	South Africa	12341234		1	2025-11-19 23:46:36.137729	2025-11-19 23:46:36.137729
2	Eskom	eskom@eskom.co.za	+27123123123	Eskom	165 west street	johannesburg	South Africa	4500299245		1	2025-11-24 10:58:51.547204	2025-11-24 10:58:51.547204
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, client_id, first_name, last_name, email, phone, "position", department, is_primary, notes, created_by, created_at, updated_at) FROM stdin;
2	1	other	Guy	guy@email.com	121212121212	Clerk	Dishes	f		1	2025-11-19 23:49:16.984955	2025-11-24 01:21:02.786483
1	1	Rayhaan	Younuss	rayhaan.younuss@test.com	1234567890	Boss	Home	t		1	2025-11-19 23:47:39.725646	2025-11-24 01:21:07.802607
3	2	Rayhaan	Younuss	rayhaan.younuss@scarybyte.co.za	+27123123123	Boss	Owner	f		1	2025-11-24 10:59:31.623408	2025-11-24 11:50:22.071434
4	2	Carmen	Hull	carmen@scarybyte.co.za	+27456456456	Boss 2	Sales	t		1	2025-11-24 11:00:22.651347	2025-11-30 04:43:24.133653
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, name, email, phone, company, source, status, assigned_to, notes, created_by, created_at, updated_at, client_id) FROM stdin;
\.


--
-- Data for Name: opportunities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opportunities (id, title, client_id, lead_id, value, stage, probability, expected_close_date, assigned_to, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description, category, created_at) FROM stdin;
1	view_clients	View clients list and details	clients	2025-11-19 23:10:55.309009
2	create_clients	Create new clients	clients	2025-11-19 23:10:55.309009
3	edit_clients	Edit existing clients	clients	2025-11-19 23:10:55.309009
4	delete_clients	Delete clients	clients	2025-11-19 23:10:55.309009
5	view_products	View products list and details	products	2025-11-19 23:10:55.309009
6	create_products	Create new products	products	2025-11-19 23:10:55.309009
7	edit_products	Edit existing products	products	2025-11-19 23:10:55.309009
8	delete_products	Delete products	products	2025-11-19 23:10:55.309009
9	view_leads	View leads list and details	leads	2025-11-19 23:10:55.309009
10	create_leads	Create new leads	leads	2025-11-19 23:10:55.309009
11	edit_leads	Edit existing leads	leads	2025-11-19 23:10:55.309009
12	delete_leads	Delete leads	leads	2025-11-19 23:10:55.309009
13	view_opportunities	View opportunities list and details	opportunities	2025-11-19 23:10:55.309009
14	create_opportunities	Create new opportunities	opportunities	2025-11-19 23:10:55.309009
15	edit_opportunities	Edit existing opportunities	opportunities	2025-11-19 23:10:55.309009
16	delete_opportunities	Delete opportunities	opportunities	2025-11-19 23:10:55.309009
17	view_quotations	View quotations list and details	quotations	2025-11-19 23:10:55.309009
18	create_quotations	Create new quotations	quotations	2025-11-19 23:10:55.309009
19	edit_quotations	Edit existing quotations	quotations	2025-11-19 23:10:55.309009
20	delete_quotations	Delete quotations	quotations	2025-11-19 23:10:55.309009
21	generate_pdf	Generate PDF quotations	quotations	2025-11-19 23:10:55.309009
22	manage_users	Manage user accounts	admin	2025-11-19 23:10:55.309009
23	manage_permissions	Manage user permissions	admin	2025-11-19 23:10:55.309009
24	view_reports	View analytics and reports	admin	2025-11-19 23:10:55.309009
25	view_tasks	View tasks	tasks	2025-12-02 21:44:23.774888
26	create_tasks	Create new tasks	tasks	2025-12-02 21:44:23.774888
27	edit_tasks	Edit tasks	tasks	2025-12-02 21:44:23.774888
28	delete_tasks	Delete tasks	tasks	2025-12-02 21:44:23.774888
29	view_projects	View projects	projects	2025-12-02 21:44:23.774888
30	create_projects	Create new projects	projects	2025-12-02 21:44:23.774888
31	edit_projects	Edit projects	projects	2025-12-02 21:44:23.774888
32	delete_projects	Delete projects	projects	2025-12-02 21:44:23.774888
33	manage_task_admin	Manage task departments and subcategories	tasks	2025-12-02 21:44:23.774888
\.


--
-- Data for Name: product_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_tags (id, name, color, created_by, created_at) FROM stdin;
1	Firewall	#3182ce	1	2025-11-20 21:05:03.067853
2	Appliance	#3182ce	1	2025-11-20 21:05:14.693655
3	Professional Services	#3182ce	1	2025-11-24 11:01:45.28451
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, sku, price, cost, category, unit, is_active, created_by, created_at, updated_at, product_type, item_type, service_unit, tags, rate) FROM stdin;
1	Sophos Firewall	Perimeter Firewall		123123.00	12345.00	Appliance	qty	t	1	2025-11-20 21:04:52.607223	2025-11-20 21:04:52.607223	item	Hardware	\N	{}	\N
5	Penetration Test	Penetration Test	\N	900.00	\N	Offensive Security	\N	t	1	2025-11-20 21:12:05.928032	2025-11-20 21:12:05.928032	service	\N	Hour	{}	900.00
6	Security Consulting	IT Consulting Hours	\N	1500.00	\N	Professional Services	\N	t	1	2025-11-24 01:33:49.217803	2025-11-24 01:33:49.217803	service	\N	Hour	{}	1500.00
7	GRC Consulting	Governance, Risk, and Compliance professional services	\N	1200.00	\N	Service	\N	t	1	2025-11-24 11:01:34.477666	2025-11-24 11:01:53.465239	service	\N	Hour	{"Professional Services"}	1200.00
9	Kaspersky Antivirus	Endpoint Protection	1	850.00	850.00	Software	Qty	t	1	2025-11-24 11:51:25.077832	2025-11-24 11:51:25.077832	item	Software	\N	{}	\N
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, name, description, client_id, status, priority, start_date, due_date, completion_date, budget, actual_cost, project_manager_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quotation_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_templates (id, name, is_default, company_name, company_tagline, company_address, company_phone, company_email, company_website, company_reg_number, company_vat_number, logo_url, primary_color, secondary_color, accent_color, show_logo, show_tagline, show_client_info, show_description, show_terms, show_signature, default_terms, default_notes, vat_rate, vat_number, created_by, created_at, updated_at) FROM stdin;
1	ScaryByte Default	t	ScaryByte (Pty) Ltd	MILITARY GRADE CYBER SOLUTIONS	165 West Street, Sandton, Johannesburg	+27 (0) 10 006 3999	support@scarybyte.co.za	WWW.SCARYBYTE.CO.ZA	2021/324782/07	4500299245	\N	#8B0000	#FFFFFF	#000000	t	t	t	t	t	t	This quotation is not a contract nor a bill. This document serves as an accurate representation of monies due to ScaryByte for services/products that have been provided by ScaryByte. Clients will be billed after ScaryByte has received a signed copy of the quotation which indicates an acceptance of the quotation. Please email all completed documents to support@scarybyte.co.za. All prices are in South African Rands (ZAR).	\N	15.00	\N	\N	2025-11-22 23:47:36.627025	2025-11-22 23:47:36.627025
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotations (id, quote_number, client_id, opportunity_id, status, valid_until, subtotal, tax_rate, tax_amount, discount, total, items, notes, terms, created_by, created_at, updated_at, template_id, description, prepared_by) FROM stdin;
9	20251130002	2	\N	draft	2025-11-26	23750.00	15.00	3562.50	0.00	27312.50	[{"name": "GRC Consulting", "price": "1200.00", "quantity": "12", "product_id": "7", "description": "Governance, Risk, and Compliance professional services"}, {"name": "Kaspersky Antivirus", "price": "850.00", "quantity": "11", "product_id": "9", "description": "Endpoint Protection"}]			1	2025-11-30 04:30:54.127677	2025-11-30 04:30:54.127677	1	Test New email	Rayhaan
10	20251130003	2	\N	draft	2025-11-27	125173.00	15.00	18775.95	0.00	143948.95	[{"name": "GRC Consulting", "price": "1200.00", "quantity": 1, "product_id": "7", "description": "Governance, Risk, and Compliance professional services"}, {"name": "Kaspersky Antivirus", "price": "850.00", "quantity": 1, "product_id": "9", "description": "Endpoint Protection"}, {"name": "Sophos Firewall", "price": "123123.00", "quantity": 1, "product_id": "1", "description": "Perimeter Firewall"}]			1	2025-11-30 04:42:33.558497	2025-11-30 04:42:33.558497	1	Test Again	Rayhaan Test
11	20251130004	2	\N	draft	2025-11-24	254496.00	15.00	38174.40	0.00	292670.40	[{"name": "Sophos Firewall", "price": "123123.00", "quantity": 1, "product_id": "1", "description": "Perimeter Firewall"}, {"name": "Kaspersky Antivirus", "price": "850.00", "quantity": 1, "product_id": "9", "description": "Endpoint Protection"}, {"name": "GRC Consulting", "price": "1200.00", "quantity": 1, "product_id": "7", "description": "Governance, Risk, and Compliance professional services"}, {"name": "Kaspersky Antivirus", "price": "850.00", "quantity": 1, "product_id": "9", "description": "Endpoint Protection"}, {"name": "Penetration Test", "price": "900.00", "quantity": 1, "product_id": "5", "description": "Penetration Test"}, {"name": "Penetration Test", "price": "900.00", "quantity": 1, "product_id": "5", "description": "Penetration Test"}, {"name": "Kaspersky Antivirus", "price": "850.00", "quantity": 1, "product_id": "9", "description": "Endpoint Protection"}, {"name": "GRC Consulting", "price": "1200.00", "quantity": 1, "product_id": "7", "description": "Governance, Risk, and Compliance professional services"}, {"name": "Sophos Firewall", "price": "123123.00", "quantity": 1, "product_id": "1", "description": "Perimeter Firewall"}, {"name": "Security Consulting", "price": "1500.00", "quantity": 1, "product_id": "6", "description": "IT Consulting Hours"}]			1	2025-11-30 05:13:51.84398	2025-12-02 20:28:17.466861	1	Two page quote	ggg
\.


--
-- Data for Name: service_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_units (id, name, abbreviation, created_by, created_at) FROM stdin;
1	Hour	hr	\N	2025-11-20 20:54:46.171557
2	Day	day	\N	2025-11-20 20:54:46.171557
3	Week	wk	\N	2025-11-20 20:54:46.171557
4	Month	mo	\N	2025-11-20 20:54:46.171557
5	Resource	res	\N	2025-11-20 20:54:46.171557
6	Project	proj	\N	2025-11-20 20:54:46.171557
7	Session	sess	\N	2025-11-20 20:54:46.171557
8	Quantity	Qty	1	2025-11-20 21:05:33.228113
\.


--
-- Data for Name: task_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_departments (id, name, description, is_active, created_by, created_at, updated_at) FROM stdin;
1	Security Operations	Security operations and monitoring tasks	t	\N	2025-12-02 21:44:23.794704	2025-12-02 21:44:23.794704
2	Penetration Testing	Penetration testing and vulnerability assessment	t	\N	2025-12-02 21:44:23.794704	2025-12-02 21:44:23.794704
3	Compliance	Compliance and audit related tasks	t	\N	2025-12-02 21:44:23.794704	2025-12-02 21:44:23.794704
4	Incident Response	Security incident response and investigation	t	\N	2025-12-02 21:44:23.794704	2025-12-02 21:44:23.794704
5	Consulting	Client consulting and advisory services	t	\N	2025-12-02 21:44:23.794704	2025-12-02 21:44:23.794704
6	Infrastructure	Infrastructure setup and maintenance	t	\N	2025-12-02 21:44:23.794704	2025-12-02 21:44:23.794704
7	Development	Software development and customization	t	\N	2025-12-02 21:44:23.794704	2025-12-02 21:44:23.794704
8	Support	Technical support and troubleshooting	t	\N	2025-12-02 21:44:23.794704	2025-12-02 21:44:23.794704
\.


--
-- Data for Name: task_subcategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_subcategories (id, department_id, name, description, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task_team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_team_members (id, task_id, user_id, hours_worked, added_at) FROM stdin;
4	2	2	0.00	2025-12-02 22:59:54.949489
7	1	1	0.00	2025-12-02 23:11:06.13803
8	1	2	0.00	2025-12-02 23:11:06.13803
9	3	2	0.00	2025-12-02 23:20:51.168356
10	3	1	0.00	2025-12-02 23:20:51.168356
11	4	2	0.00	2025-12-02 23:58:53.070591
12	4	1	0.00	2025-12-02 23:58:53.070591
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, ticket_number, ticket_url, priority, department_id, subcategory_id, project_id, status, start_date, due_date, close_date, total_hours, created_by, created_at, updated_at, client_id) FROM stdin;
2	Test 2	Test 2	2345	\N	P1	1	\N	\N	closed	2025-11-12	2025-11-30	\N	7.00	1	2025-12-02 22:59:54.949489	2025-12-02 22:59:54.949489	\N
1	Test	Test Task	1234	https://i.pinimg.com/originals/df/25/96/df2596b086219446585c8c78e6a94a75.jpg	P1	1	\N	\N	awaiting_feedback	2025-11-26	2025-12-12	2025-11-30	3.00	1	2025-12-02 22:37:58.421974	2025-12-02 23:11:06.13803	\N
3	Test 3	Test 3	3456	\N	P2	2	\N	\N	on-going	2025-12-01	2025-12-03	\N	6.00	1	2025-12-02 23:20:51.168356	2025-12-02 23:20:51.168356	\N
4	Test	Test Description	1234	https://i.pinimg.com/originals/df/25/96/df2596b086219446585c8c78e6a94a75.jpg	P2	7	\N	\N	closed	2025-11-29	2025-11-30	2025-12-02	3.50	1	2025-12-02 23:58:53.070591	2025-12-03 00:03:52.937993	1
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, user_id, permission_id, granted_by, granted_at) FROM stdin;
1	1	1	1	2025-11-19 23:10:55.309009
2	1	2	1	2025-11-19 23:10:55.309009
3	1	3	1	2025-11-19 23:10:55.309009
4	1	4	1	2025-11-19 23:10:55.309009
5	1	5	1	2025-11-19 23:10:55.309009
6	1	6	1	2025-11-19 23:10:55.309009
7	1	7	1	2025-11-19 23:10:55.309009
8	1	8	1	2025-11-19 23:10:55.309009
9	1	9	1	2025-11-19 23:10:55.309009
10	1	10	1	2025-11-19 23:10:55.309009
11	1	11	1	2025-11-19 23:10:55.309009
12	1	12	1	2025-11-19 23:10:55.309009
13	1	13	1	2025-11-19 23:10:55.309009
14	1	14	1	2025-11-19 23:10:55.309009
15	1	15	1	2025-11-19 23:10:55.309009
16	1	16	1	2025-11-19 23:10:55.309009
17	1	17	1	2025-11-19 23:10:55.309009
18	1	18	1	2025-11-19 23:10:55.309009
19	1	19	1	2025-11-19 23:10:55.309009
20	1	20	1	2025-11-19 23:10:55.309009
21	1	21	1	2025-11-19 23:10:55.309009
22	1	22	1	2025-11-19 23:10:55.309009
23	1	23	1	2025-11-19 23:10:55.309009
24	1	24	1	2025-11-19 23:10:55.309009
25	2	1	1	2025-11-19 23:10:55.309009
26	2	5	1	2025-11-19 23:10:55.309009
27	2	9	1	2025-11-19 23:10:55.309009
28	2	13	1	2025-11-19 23:10:55.309009
29	2	17	1	2025-11-19 23:10:55.309009
30	1	25	1	2025-12-02 21:58:04.495545
31	1	26	1	2025-12-02 21:58:04.495545
32	1	27	1	2025-12-02 21:58:04.495545
33	1	28	1	2025-12-02 21:58:04.495545
34	1	29	1	2025-12-02 21:58:04.495545
35	1	30	1	2025-12-02 21:58:04.495545
36	1	31	1	2025-12-02 21:58:04.495545
37	1	32	1	2025-12-02 21:58:04.495545
38	1	33	1	2025-12-02 21:58:04.495545
39	2	25	1	2025-12-02 21:58:04.538881
40	2	26	1	2025-12-02 21:58:04.538881
41	2	27	1	2025-12-02 21:58:04.538881
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, full_name, role, is_active, created_at, updated_at) FROM stdin;
1	admin	admin@crm.com	$2a$10$dhldrftMDEFQ7bFmO1WpZeXY0Qj97X/3OuBKJVy5nHVx4iQk7255q	System Administrator	admin	t	2025-11-19 23:10:55.309009	2025-11-19 23:10:55.309009
2	user	user@crm.com	$2a$10$eWoylB29mZhB4/I3m.oGqulZ11pKrPEgxN8BwH6tqLvWgi6Jk5ANq	Standard User	user	t	2025-11-19 23:10:55.309009	2025-11-19 23:10:55.309009
\.


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 2, true);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contacts_id_seq', 4, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leads_id_seq', 1, false);


--
-- Name: opportunities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opportunities_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 43, true);


--
-- Name: product_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_tags_id_seq', 3, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 9, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, false);


--
-- Name: quotation_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_templates_id_seq', 1, true);


--
-- Name: quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotations_id_seq', 11, true);


--
-- Name: service_units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_units_id_seq', 8, true);


--
-- Name: task_departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_departments_id_seq', 16, true);


--
-- Name: task_subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_subcategories_id_seq', 1, false);


--
-- Name: task_team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_team_members_id_seq', 12, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 4, true);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 42, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: product_tags product_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_name_key UNIQUE (name);


--
-- Name: product_tags product_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: quotation_templates quotation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_quote_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_quote_number_key UNIQUE (quote_number);


--
-- Name: service_units service_units_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_units
    ADD CONSTRAINT service_units_name_key UNIQUE (name);


--
-- Name: service_units service_units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_units
    ADD CONSTRAINT service_units_pkey PRIMARY KEY (id);


--
-- Name: task_departments task_departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_departments
    ADD CONSTRAINT task_departments_name_key UNIQUE (name);


--
-- Name: task_departments task_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_departments
    ADD CONSTRAINT task_departments_pkey PRIMARY KEY (id);


--
-- Name: task_subcategories task_subcategories_department_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_subcategories
    ADD CONSTRAINT task_subcategories_department_id_name_key UNIQUE (department_id, name);


--
-- Name: task_subcategories task_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_subcategories
    ADD CONSTRAINT task_subcategories_pkey PRIMARY KEY (id);


--
-- Name: task_team_members task_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_team_members
    ADD CONSTRAINT task_team_members_pkey PRIMARY KEY (id);


--
-- Name: task_team_members task_team_members_task_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_team_members
    ADD CONSTRAINT task_team_members_task_id_user_id_key UNIQUE (task_id, user_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_user_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_permission_id_key UNIQUE (user_id, permission_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_contacts_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_client_id ON public.contacts USING btree (client_id);


--
-- Name: idx_contacts_is_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_is_primary ON public.contacts USING btree (is_primary);


--
-- Name: idx_leads_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_client_id ON public.leads USING btree (client_id);


--
-- Name: idx_products_product_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_product_type ON public.products USING btree (product_type);


--
-- Name: idx_products_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_tags ON public.products USING gin (tags);


--
-- Name: idx_projects_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_client ON public.projects USING btree (client_id);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_task_team_members_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_team_members_task ON public.task_team_members USING btree (task_id);


--
-- Name: idx_task_team_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_team_members_user ON public.task_team_members USING btree (user_id);


--
-- Name: idx_tasks_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_client ON public.tasks USING btree (client_id);


--
-- Name: idx_tasks_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_created_by ON public.tasks USING btree (created_by);


--
-- Name: idx_tasks_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_department ON public.tasks USING btree (department_id);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_priority ON public.tasks USING btree (priority);


--
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: contacts trigger_ensure_single_primary_contact; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_ensure_single_primary_contact BEFORE INSERT OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_contact();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: task_departments update_task_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_task_departments_updated_at BEFORE UPDATE ON public.task_departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: task_subcategories update_task_subcategories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_task_subcategories_updated_at BEFORE UPDATE ON public.task_subcategories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: contacts contacts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: leads leads_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: leads leads_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: opportunities opportunities_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: opportunities opportunities_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: opportunities opportunities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: opportunities opportunities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);


--
-- Name: product_tags product_tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: products products_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: projects projects_project_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_manager_id_fkey FOREIGN KEY (project_manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quotation_templates quotation_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: quotations quotations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: quotations quotations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: quotations quotations_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id);


--
-- Name: quotations quotations_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.quotation_templates(id) ON DELETE SET NULL;


--
-- Name: service_units service_units_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_units
    ADD CONSTRAINT service_units_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: task_departments task_departments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_departments
    ADD CONSTRAINT task_departments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: task_subcategories task_subcategories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_subcategories
    ADD CONSTRAINT task_subcategories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: task_subcategories task_subcategories_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_subcategories
    ADD CONSTRAINT task_subcategories_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.task_departments(id) ON DELETE CASCADE;


--
-- Name: task_team_members task_team_members_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_team_members
    ADD CONSTRAINT task_team_members_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_team_members task_team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_team_members
    ADD CONSTRAINT task_team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: tasks tasks_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.task_departments(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.task_subcategories(id) ON DELETE SET NULL;


--
-- Name: user_permissions user_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- Name: user_permissions user_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9DCgxvuWFHPidiWrZ5L2WGCYOSEsUiVT0hMmO2fA1pWIDkgdEt8YkeyTY3CARHj

