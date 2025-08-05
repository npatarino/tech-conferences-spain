Conferences
===========

A community-curated list of Software Development conferences around Spain.

📊 **Current Stats:**
- **298 conferences** organized
- **302 unique events** tracked
- Conferences grouped by event for better organization

## Repository Structure

The conferences are organized by event in separate directories within `_conferences/`. Each event has its own folder containing all the conference files for different years.

### Structure Example:
```
_conferences/
├── t3chfest-madrid/
│   ├── t3chfest-madrid-2019.md
│   ├── t3chfest-madrid-2020.md
│   ├── t3chfest-madrid-2023.md
│   └── ...
├── codemotion-madrid/
│   ├── codemotion-madrid-2019.md
│   ├── codemotion-madrid-2023.md
│   └── ...
└── jsday-canarias-tenerife/
    ├── jsday-canarias-tenerife-2019.md
    ├── jsday-canarias-tenerife-2020.md
    └── ...
```

## Adding a Conference

### For a New Event
1. Create a new directory in `_conferences/` with the event name format: `event-name-city/`
2. Add the conference file inside that directory

### For an Existing Event
1. Find the appropriate event directory in `_conferences/`
2. Add your conference file to that directory

### File Naming Convention
Files should be named with the format: `event-name-city-YYYY.md`

For example:
- `coolconf-madrid-2024.md` (goes in `_conferences/coolconf-madrid/`)
- `devfest-barcelona-2025.md` (goes in `_conferences/devfest-barcelona/`)

### File Template
The contents of the file should use the following template:
```yaml
---
name: "CoolConf"
website: http://es.coolconf.com/2024/
twitter: http://twitter.com/coolconf/
location: Illescas, Toledo, Spain

date_start: 2024-10-18
date_end:   2024-10-30

cfp_start: 2024-06-20  # Optional
cfp_end:   2024-07-21  # Optional
cfp_site: http://es.coolconf.com/2024/call-for-papers/ # Optional, will default to website
---
```

*Note: Do not include the location of the conference in the name. The above conference is often referred to as "Devfest Madrid", but we will always render the location with the name so it is redundant.*

## Popular Events

Some of the most tracked events in our repository include:

**Multi-year Events (5+ editions):**
- **t3chfest-madrid** (6 editions): Technology festival
- **jsday-canarias-tenerife** (6 editions): JavaScript conference
- **spring-io-barcelona** (5 editions): Spring Framework conference
- **software-crafters-barcelona** (5 editions): Software craftsmanship
- **salmorejo-tech-cordoba** (5 editions): Technology conference
- **morcillaconf-burgos** (5 editions): Tech conference
- **j-on-the-beach-malaga** (5 editions): Java and technology
- **commit-madrid** (5 editions): Software development
- **bilbostack-bilbao** (5 editions): Technology stack conference

**Technology Focus Areas:**
- Frontend/JavaScript: jsday-canarias, js-camp-barcelona, frontfest-madrid
- Java/JVM: j-on-the-beach, spring-io-barcelona, jbcnconf-barcelona
- DevOps: devopsdays-madrid, devopsdays-caceres, devops-barcelona
- Mobile: droidcon-madrid, flutterconf-marbella
- Python: pycones (multiple cities)
- .NET: netcoreconf (multiple cities)
- Security: rootedcon-madrid, navaja-negra-conference-albacete

Running locally
---------------

## Traditional

```
bundle install --path vendor/bundle
bundle exec jekyll serve
```

Once running the site can be opened at [http://localhost:4000](http://localhost:4000).

## Docker

Compile image

```
docker build -t tech-conferences-spain-app .
```

Run image

```
docker run --rm -it -v ./:/usr/src/app -p 4000:4000 -p 35729:35729 tech-conferences-spain-app bundle exec jekyll serve
```

Once running the site can be opened at [http://localhost:4000](http://localhost:4000).

## Contributing

We welcome contributions! To maintain consistency:

1. **Follow the naming conventions** described above
2. **Place files in the correct event directory**
3. **Use the provided YAML template**
4. **Keep information up-to-date**

For questions or suggestions about the repository structure, please open an issue.

## License

All content is [CC0][1].


 [1]: https://creativecommons.org/publicdomain/zero/1.0/
